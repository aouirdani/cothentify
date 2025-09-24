export type PlanKey = 'essential' | 'premium' | 'professional';
export type Billing = 'monthly' | 'yearly';

// Centralized pricing (USD)
// Update these when pricing changes.
const PRICES_USD: Record<PlanKey, { monthly: number; yearly: number }> = {
  essential: { monthly: 7.99, yearly: 7.99 * 10 }, // 2 months free billed annually
  premium: { monthly: 15.99, yearly: 15.99 * 10 },
  professional: { monthly: 23.99, yearly: 23.99 * 10 },
};

export function getPriceUSD(plan: PlanKey, billing: Billing) {
  const cfg = PRICES_USD[plan];
  if (!cfg) return { amount: 0, currency: 'USD' as const };
  const amount = billing === 'yearly' ? round2(cfg.yearly) : round2(cfg.monthly);
  return { amount, currency: 'USD' as const };
}

export function formatPrice(amount: number, currency: string, billing: Billing) {
  const fmt = new Intl.NumberFormat('en-US', { style: 'currency', currency });
  return `${fmt.format(amount)}${billing === 'yearly' ? ' / yr' : ' / mo'}`;
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

