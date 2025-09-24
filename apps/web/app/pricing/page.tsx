import { useMemo } from 'react';
import { Card, CardHeader } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { SectionHeading } from '../../components/ui/section-heading';
import BillingToggle from '../../components/pricing/BillingToggle';
import { getPriceUSD, formatPrice } from '../../lib/payments';

type Billing = 'monthly' | 'yearly';

type Plan = {
  id: string;
  name: string;
  monthly: number; // base monthly price
  description: string;
  features: string[];
  popular?: boolean;
};

const plans: Plan[] = [
  {
    id: 'freemium',
    name: 'FREEMIUM',
    monthly: 0,
    description: 'Explore the platform with limited analysis volume.',
    features: ['10 analyses / month', 'Basic detector', 'Community support'],
  },
  {
    id: 'essential',
    name: 'ESSENTIAL',
    monthly: 7.99,
    description: 'For individuals and small projects.',
    features: ['100 analyses / month', 'Ensemble AI probability', 'Email support'],
  },
  {
    id: 'premium',
    name: 'PREMIUM',
    monthly: 15.99,
    description: 'For small teams collaborating on content workflows.',
    features: ['1,000 analyses / month', 'Team workspaces & roles', 'Priority support'],
    popular: true,
  },
  {
    id: 'professional',
    name: 'PROFESSIONAL',
    monthly: 23.99,
    description: 'For agencies needing scale and advanced reporting.',
    features: ['Unlimited analyses (fair use)', 'Advanced reports & exports', 'SLA & dedicated support'],
  },
];

export default function PricingPage({ searchParams }: { searchParams: { [k: string]: string | string[] | undefined } }) {
  const billing = (Array.isArray(searchParams?.billing) ? searchParams?.billing[0] : searchParams?.billing) === 'yearly' ? 'yearly' : 'monthly';

  const priceFor = (p: Plan) => {
    if (p.monthly === 0) return 0;
    const map: any = { essential: 'essential', premium: 'premium', professional: 'professional' };
    const price = getPriceUSD(map[p.id] as any, billing as any);
    // Show effective monthly for yearly by dividing by 12
    const eff = billing === 'yearly' ? (price.amount / 12) : price.amount;
    return Number(eff.toFixed(2));
  };

  const billingNote = useMemo(
    () => (billing === 'monthly' ? 'Billed monthly' : 'Billed annually (2 months free)'),
    [billing],
  );

  async function checkout(planId: string) {
    if (planId === 'freemium') {
      window.location.href = '/dashboard';
      return;
    }
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planId, billing }),
      });
      const json = await res.json();
      if (json?.url) {
        window.location.href = json.url;
      } else {
        toast('Redirecting to dashboard...');
        window.location.href = '/dashboard';
      }
    } catch (e: any) {
      toast.error(e?.message || 'Checkout failed');
    }
  }

  return (
    <div className="py-4">
      <SectionHeading title="Simple, transparent pricing" subtitle="Choose a plan that fits your team." />

      <BillingToggle billing={billing} />
      <div className="mb-6 text-center text-xs text-slate-600">{billingNote}</div>

      <div className="grid gap-6 md:grid-cols-4">
        {plans.map((p) => (
          <Card key={p.id} className={`${p.popular ? 'ring-1 ring-brand/40' : ''}`}>
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm font-medium text-slate-500">{p.name}</div>
                <div className="mt-1 flex items-baseline gap-1">
                  <div className="text-3xl font-semibold">${priceFor(p)}</div>
                  <div className="text-sm text-slate-500">/ month</div>
                </div>
              </div>
              {p.popular && (
                <span className="rounded-full bg-brand/10 px-2 py-1 text-xs font-medium text-brand">Most popular</span>
              )}
            </div>
            <p className="mt-3 text-sm text-slate-600">{p.description}</p>
            <ul className="mt-4 grid gap-2 text-sm text-slate-700">
              {p.features.map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-brand" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <div className="mt-6">
              {p.monthly === 0 ? (
                <a href="/auth/signup">
                  <Button className="w-full" variant={p.popular ? 'primary' : 'secondary'}>Get Started</Button>
                </a>
              ) : (
                <a href={`/checkout/subscribe?plan=${p.id}&billing=${billing}`}>
                  <Button className="w-full" variant={p.popular ? 'primary' : 'secondary'}>Continue</Button>
                </a>
              )}
            </div>
          </Card>
        ))}
      </div>

      <Card className="mt-8 bg-white/70">
        <CardHeader title="Need enterprise?" subtitle="Contact us for SSO, on-prem options, and custom SLAs." />
        <a className="text-blue-600 underline" href="#demo">Request a custom quote</a>
      </Card>

      {/* Compare plans */}
      <div className="mt-10">
        <SectionHeading title="Compare plans" subtitle="Features by tier" />
        <div className="overflow-hidden rounded-xl border">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Feature</th>
                {plans.map((p) => (
                  <th key={p.id} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">{p.name}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white text-sm">
              {[
                { k: 'Analyses / month', vals: ['10', '100', '1000', 'Unlimited*'] },
                { k: 'Ensemble detection', vals: ['—', '✓', '✓', '✓'] },
                { k: 'Team workspaces', vals: ['—', '—', '✓', '✓'] },
                { k: 'Advanced reports', vals: ['—', '—', '—', '✓'] },
                { k: 'Support', vals: ['Community', 'Email', 'Priority', 'Dedicated'] },
              ].map((row) => (
                <tr key={row.k}>
                  <td className="px-4 py-3 font-medium text-slate-800">{row.k}</td>
                  {row.vals.map((v, i) => (
                    <td key={i} className="px-4 py-3 text-slate-700">{v}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-2 text-xs text-slate-500">* Fair use limits may apply to ensure quality of service.</div>
      </div>

      {/* FAQ */}
      <div className="mt-10">
        <SectionHeading title="Frequently asked questions" />
        <div className="grid gap-4 md:grid-cols-2">
          {[
            { q: 'Can I change plans later?', a: 'Yes, you can upgrade or downgrade at any time. Changes take effect from your next billing cycle.' },
            { q: 'Do you offer refunds?', a: 'We offer a pro-rated refund if you cancel within 7 days of a new billing period.' },
            { q: 'Is there a free plan?', a: 'Yes — the Freemium plan lets you experiment with the detector with limited monthly analyses.' },
            { q: 'Do you support annual billing?', a: 'Yes — select Yearly for 2 months free (billed once per year).' },
          ].map((f) => (
            <div key={f.q} className="rounded-xl border bg-white p-4">
              <div className="font-medium">{f.q}</div>
              <p className="mt-1 text-sm text-slate-600">{f.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
