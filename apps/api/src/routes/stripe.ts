import type { FastifyInstance } from 'fastify';
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
      const Stripe = (await import('stripe')).default;
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
        apiVersion: '2024-06-20',
      } as any);
      let event: any;
      try {
        const raw = (req as any).rawBody as string;
        event = stripe.webhooks.constructEvent(raw, sig, env.STRIPE_WEBHOOK_SECRET);
      } catch (err: any) {
        return reply.code(400).send({ error: `Invalid signature: ${err.message}` });
      }

      if (event.type === 'checkout.session.completed') {
        const session = event.data.object as any;
        const plan = (session.metadata?.plan || '').toUpperCase();
        const email = session.metadata?.email || session.customer_details?.email;
        const billing = (session.metadata?.billing || '').toUpperCase();
        const subscriptionId = session.subscription as string | undefined;
        const customerId = (session.customer as string | undefined) || session.customer_details?.customer;
        if (plan && email) {
          try {
            await prisma.user.upsert({
              where: { email },
              update: { plan: plan as any },
              create: { email, plan: plan as any },
            });
            await prisma.billingSubscription.upsert({
              where: { stripeSubscriptionId: subscriptionId ?? '' },
              update: {
                email,
                plan: plan as any,
                status: 'ACTIVE' as any,
                billingCycle: billing === 'YEARLY' ? ('YEARLY' as any) : ('MONTHLY' as any),
                stripeCustomerId: customerId,
                meta: session as any,
              },
              create: {
                email,
                plan: plan as any,
                status: 'ACTIVE' as any,
                billingCycle: billing === 'YEARLY' ? ('YEARLY' as any) : ('MONTHLY' as any),
                stripeCustomerId: customerId,
                stripeSubscriptionId: subscriptionId,
                meta: session as any,
              },
            });
          } catch {}
        }
      }

      if (event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.created') {
        const sub = event.data.object as any;
        const subscriptionId = sub.id as string;
        const status = String(sub.status || 'active').toUpperCase();
        const customerId = sub.customer as string | undefined;
        const currentPeriodEnd = sub.current_period_end ? new Date(sub.current_period_end * 1000) : null;
        try {
          await prisma.billingSubscription.update({
            where: { stripeSubscriptionId: subscriptionId },
            data: {
              status: mapStripeStatus(status) as any,
              stripeCustomerId: customerId,
              currentPeriodEnd: currentPeriodEnd ?? undefined,
              meta: sub as any,
            },
          });
        } catch {}
      }

      if (event.type === 'customer.subscription.deleted') {
        const sub = event.data.object as any;
        const subscriptionId = sub.id as string;
        try {
          await prisma.billingSubscription.update({
            where: { stripeSubscriptionId: subscriptionId },
            data: { status: 'CANCELED' as any, meta: sub as any },
          });
        } catch {}
      }
      return reply.send({ received: true });
    },
  });
}

function mapStripeStatus(s: string) {
  switch (s) {
    case 'ACTIVE':
      return 'ACTIVE';
    case 'TRIALING':
      return 'TRIALING';
    case 'PAST_DUE':
      return 'PAST_DUE';
    case 'UNPAID':
      return 'UNPAID';
    case 'CANCELED':
      return 'CANCELED';
    case 'INCOMPLETE':
    case 'INCOMPLETE_EXPIRED':
      return 'INCOMPLETE';
    default:
      return 'ACTIVE';
  }
}
