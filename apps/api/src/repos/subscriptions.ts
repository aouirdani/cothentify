import { PrismaClient, PlanTier, SubscriptionStatus, BillingCycle, Prisma } from '@prisma/client';

export type Provider = 'stripe' | 'paypal';
export type Status = 'incomplete' | 'active' | 'trialing' | 'past_due' | 'canceled' | 'unpaid' | 'paused';
export type Billing = BillingCycle | null | undefined;

export interface UpsertStatusArgs {
  provider: Provider;
  externalId: string; // Stripe subscription ID or PayPal order/subscription ID
  status: Status;
  email?: string;
  plan?: PlanTier;
  billing?: Billing;
  meta?: Record<string, unknown>;
}

// NOTE: Schema currently has only `stripeSubscriptionId` unique field.
// We use it to store the externalId for both providers for simplicity.
export async function upsertSubscriptionStatus(prisma: PrismaClient, args: UpsertStatusArgs) {
  const { externalId, status, email, plan, billing, meta } = args;

  const billingCycle = billing ?? null;
  const metaValue: Prisma.NullableJsonNullValueInput | Prisma.InputJsonValue =
    meta ? (meta as Prisma.InputJsonValue) : Prisma.JsonNull;
  const planValue: PlanTier = plan ?? PlanTier.FREEMIUM;

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
      billingCycle,
      meta: metaValue,
    },
    create: {
      email: email || 'unknown@example.com',
      plan: planValue,
      status: toPrismaStatus(status),
      billingCycle,
      stripeSubscriptionId: externalId,
      meta: metaValue,
    },
  });

  if (email && plan && (status === 'active' || status === 'trialing')) {
    await prisma.user.upsert({
      where: { email },
      update: { plan },
      create: { email, plan },
    });
  }
}
