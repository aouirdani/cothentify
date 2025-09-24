// Strongly-typed persistence repo stub for payments and subscriptions.
// Replace with real DB access (Prisma/Drizzle/etc.).

export type Provider = 'stripe' | 'paypal';
export type Billing = 'monthly' | 'yearly';
export type Plan = 'freemium' | 'essential' | 'premium' | 'professional';

export enum SubscriptionStatus {
  Incomplete = 'incomplete',
  Active = 'active',
  Trialing = 'trialing',
  PastDue = 'past_due',
  Canceled = 'canceled',
  Unpaid = 'unpaid',
  Paused = 'paused',
}

export interface User {
  id: string;
  email: string;
  name?: string | null;
  plan: Plan;
}

export interface Subscription {
  id: string;
  userEmail: string;
  provider: Provider;
  externalId: string; // Stripe sub ID or PayPal order/sub ID
  plan: Plan;
  billing: Billing;
  status: SubscriptionStatus;
  currentPeriodEnd?: string; // ISO
  meta?: Record<string, unknown>;
}

export interface PaymentsRepo {
  upsertUser(user: User): Promise<void>;
  upsertSubscription(sub: Subscription): Promise<void>;
  updateSubscriptionStatus(provider: Provider, externalId: string, status: SubscriptionStatus, meta?: Record<string, unknown>): Promise<void>;
}

const memUsers = new Map<string, User>();
const memSubs = new Map<string, Subscription>();

export const InMemoryPaymentsRepo: PaymentsRepo = {
  async upsertUser(user) {
    memUsers.set(user.email, { ...user });
  },
  async upsertSubscription(sub) {
    memSubs.set(`${sub.provider}:${sub.externalId}`, { ...sub });
  },
  async updateSubscriptionStatus(provider, externalId, status, meta) {
    const key = `${provider}:${externalId}`;
    const existing = memSubs.get(key);
    if (existing) {
      memSubs.set(key, { ...existing, status, meta: { ...(existing.meta || {}), ...(meta || {}) } });
    }
  },
};

