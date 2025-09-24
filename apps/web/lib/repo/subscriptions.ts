// Minimal repository interfaces and in-memory stub implementation for demo.
// TODO: Replace with real DB access (Prisma/Drizzle/etc.).

export type PlanId = 'essential' | 'premium' | 'professional' | 'freemium';
export type BillingCycle = 'monthly' | 'yearly';
export type Provider = 'stripe' | 'paypal';

export interface SubscriptionRecord {
  id: string;
  email: string;
  plan: PlanId;
  billing: BillingCycle;
  provider: Provider;
  status: 'incomplete' | 'active' | 'trialing' | 'past_due' | 'canceled' | 'unpaid' | 'paused';
  externalId?: string; // Stripe subscription ID or PayPal order/plan id
  currentPeriodEnd?: string; // ISO date
  meta?: Record<string, unknown>;
}

export interface SubscriptionRepo {
  upsert(sub: SubscriptionRecord): Promise<void>;
  updateStatus(externalId: string, provider: Provider, status: SubscriptionRecord['status'], meta?: Record<string, unknown>): Promise<void>;
}

const memory = new Map<string, SubscriptionRecord>();

export const InMemorySubscriptionRepo: SubscriptionRepo = {
  async upsert(sub) {
    const key = `${sub.provider}:${sub.externalId || sub.email}`;
    memory.set(key, { ...sub });
  },
  async updateStatus(externalId, provider, status, meta) {
    const findKey = Array.from(memory.keys()).find((k) => k.startsWith(provider + ':') && memory.get(k)?.externalId === externalId);
    if (findKey) {
      const rec = memory.get(findKey)!;
      memory.set(findKey, { ...rec, status, meta: { ...(rec.meta || {}), ...(meta || {}) } });
    } else {
      // Not found; create a minimal record
      memory.set(`${provider}:${externalId}`, {
        id: crypto.randomUUID(),
        email: 'unknown@example.com',
        plan: 'freemium',
        billing: 'monthly',
        provider,
        status,
        externalId,
        meta,
      });
    }
  },
};

