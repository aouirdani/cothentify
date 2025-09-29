import type { FastifyInstance } from 'fastify';
import type Stripe from 'stripe';
import { BillingCycle, PlanTier, Prisma, SubscriptionStatus } from '@prisma/client';
import { env } from '../env';
import { prisma } from '../db';

export async function stripeRoutes(app: FastifyInstance) {
  if (!env.STRIPE_WEBHOOK_SECRET || !env.STRIPE_SECRET_KEY) {
    app.log.warn('Stripe webhook not configured');
  }

  app.post('/webhook', {
    config: { rawBody: true },
    handler: async (req, reply) => {
      if (!env.STRIPE_WEBHOOK_SECRET || !env.STRIPE_SECRET_KEY) return reply.code(400).send({ ok: false });
      const sig = req.headers['stripe-signature'] as string | undefined;
      if (!sig) return reply.code(400).send({ error: 'Missing signature' });
      const { default: Stripe } = await import('stripe');
      const stripe = new Stripe(env.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' });
      let event: Stripe.Event;
      try {
        const raw = req.rawBody ?? '';
        event = stripe.webhooks.constructEvent(raw, sig, env.STRIPE_WEBHOOK_SECRET);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Invalid signature payload';
        return reply.code(400).send({ error: `Invalid signature: ${message}` });
      }

      if (event.type === 'checkout.session.completed') {
        const session = event.data.object as Stripe.Checkout.Session;
        const plan = normalizePlan(session.metadata?.plan);
        const email = session.metadata?.email ?? session.customer_details?.email ?? undefined;
        const billing = normalizeBilling(session.metadata?.billing);
        const subscriptionId = typeof session.subscription === 'string' ? session.subscription : undefined;
        const customerId = typeof session.customer === 'string' ? session.customer : undefined;
        if (plan && email) {
          try {
            await prisma.user.upsert({
              where: { email },
              update: { plan },
              create: { email, plan },
            });
            const subscriptionKey = subscriptionId ?? '';
            const metaValue = session as unknown as Prisma.InputJsonValue;
            await prisma.billingSubscription.upsert({
              where: { stripeSubscriptionId: subscriptionKey },
              update: {
                email,
                plan,
                status: SubscriptionStatus.ACTIVE,
                billingCycle: billing ?? BillingCycle.MONTHLY,
                stripeCustomerId: customerId,
                meta: metaValue,
              },
              create: {
                email,
                plan,
                status: SubscriptionStatus.ACTIVE,
                billingCycle: billing ?? BillingCycle.MONTHLY,
                stripeCustomerId: customerId,
                stripeSubscriptionId: subscriptionId,
                meta: metaValue,
              },
            });
          } catch (error) {
            app.log.error(error);
          }
        }
      }

      if (event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.created') {
        const sub = event.data.object as Stripe.Subscription;
        const subscriptionId = sub.id;
        const status = mapStripeStatus(String(sub.status || 'active').toUpperCase());
        const customerId = typeof sub.customer === 'string' ? sub.customer : undefined;
        const currentPeriodEnd = sub.current_period_end ? new Date(sub.current_period_end * 1000) : null;
        try {
          await prisma.billingSubscription.update({
            where: { stripeSubscriptionId: subscriptionId },
            data: {
              status,
              stripeCustomerId: customerId,
              currentPeriodEnd: currentPeriodEnd ?? undefined,
              meta: sub as unknown as Prisma.InputJsonValue,
            },
          });
        } catch (error) {
          app.log.error(error);
        }
      }

      if (event.type === 'customer.subscription.deleted') {
        const sub = event.data.object as Stripe.Subscription;
        const subscriptionId = sub.id;
        try {
          await prisma.billingSubscription.update({
            where: { stripeSubscriptionId: subscriptionId },
            data: { status: SubscriptionStatus.CANCELED, meta: sub as unknown as Prisma.InputJsonValue },
          });
        } catch (error) {
          app.log.error(error);
        }
      }
      return reply.send({ received: true });
    },
  });
}

function mapStripeStatus(status: string): SubscriptionStatus {
  switch (status) {
    case 'ACTIVE':
      return SubscriptionStatus.ACTIVE;
    case 'TRIALING':
      return SubscriptionStatus.TRIALING;
    case 'PAST_DUE':
      return SubscriptionStatus.PAST_DUE;
    case 'UNPAID':
      return SubscriptionStatus.UNPAID;
    case 'CANCELED':
      return SubscriptionStatus.CANCELED;
    case 'INCOMPLETE':
    case 'INCOMPLETE_EXPIRED':
      return SubscriptionStatus.INCOMPLETE;
    default:
      return SubscriptionStatus.ACTIVE;
  }
}

function normalizePlan(plan: string | null | undefined): PlanTier | null {
  if (!plan) return null;
  const normalized = plan.toUpperCase();
  return (Object.values(PlanTier) as string[]).includes(normalized) ? (normalized as PlanTier) : null;
}

function normalizeBilling(billing: string | null | undefined): BillingCycle | null {
  if (!billing) return null;
  const normalized = billing.toUpperCase();
  if (normalized === BillingCycle.MONTHLY) return BillingCycle.MONTHLY;
  if (normalized === BillingCycle.YEARLY) return BillingCycle.YEARLY;
  return null;
}
