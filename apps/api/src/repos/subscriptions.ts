import { PrismaClient, PlanTier, SubscriptionStatus } from '@prisma/client';

export type Provider = 'stripe' | 'paypal';
export type Status = 'incomplete' | 'active' | 'trialing' | 'past_due' | 'canceled' | 'unpaid' | 'paused';
export type Billing = 'MONTHLY' | 'YEARLY' | null | undefined;

export interface UpsertStatusArgs {
  provider: Provider;
  externalId: string; // Stripe subscription ID or PayPal order/subscription ID
  status: Status;
  email?: string;
  plan?: keyof typeof PlanTier; // 'FREEMIUM' | 'ESSENTIAL' | 'PREMIUM' | 'PROFESSIONAL'
  billing?: Billing; // Prisma BillingCycle enum shape
  meta?: Record<string, unknown>;
}

// NOTE: Schema currently has only `stripeSubscriptionId` unique field.
// We use it to store the externalId for both providers for simplicity.
export async function upsertSubscriptionStatus(prisma: PrismaClient, args: UpsertStatusArgs) {
  const { externalId, status, email, plan, billing, meta } = args;

  const billingCycle = billing ?? null;

  const toPrismaStatus = (s: Status): SubscriptionStatus => {
    switch (s) {
      case 'incomplete':
        return SubscriptionStatus.INCOMPLETE;
      case 'active':
        return SubscriptionStatus.ACTIVE;
      case 'trialing':
        return SubscriptionStatus.TRIALING;
      case 'past_due':
        return SubscriptionStatus.PAST_DUE;
      case 'canceled':
        return SubscriptionStatus.CANCELED;
      case 'unpaid':
        return SubscriptionStatus.UNPAID;
      default:
        return SubscriptionStatus.INCOMPLETE;
    }
  };

  await prisma.billingSubscription.upsert({
    where: { stripeSubscriptionId: externalId },
    update: {
      status: toPrismaStatus(status),
      billingCycle: billingCycle as any,
      meta: meta as any,
    },
    create: {
      email: email || 'unknown@example.com',
      plan: (plan || 'FREEMIUM') as any,
      status: toPrismaStatus(status),
      billingCycle: billingCycle as any,
      stripeSubscriptionId: externalId,
      meta: meta as any,
    },
  });

  if (email && plan && (status === 'active' || status === 'trialing')) {
    await prisma.user.upsert({
      where: { email },
      update: { plan: plan as any },
      create: { email, plan: plan as any },
    });
  }
}
