import { useMemo } from 'react';
import BillingToggle from '../../components/pricing/BillingToggle';
import { getPriceUSD, type Billing, type PlanKey } from '../../lib/payments';

type Plan = {
  id: 'freemium' | PlanKey;
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
  const billingValue = searchParams?.['billing'];
  const billingParam = Array.isArray(billingValue) ? billingValue[0] : billingValue;
  const billing: Billing = billingParam === 'yearly' ? 'yearly' : 'monthly';

  const priceFor = (planConfig: Plan) => {
    if (planConfig.id === 'freemium') return 0;
    const price = getPriceUSD(planConfig.id, billing);
    const eff = billing === 'yearly' ? price.amount / 12 : price.amount;
    return Number(eff.toFixed(2));
  };

  const billingNote = useMemo(() => (billing === 'monthly' ? 'Billed monthly' : 'Billed annually (2 months free)'), [billing]);

  return (
    <main className="container py-16">
      <h1 className="text-4xl font-bold text-center">Ready to get started?</h1>
      <p className="text-slate-300 text-center mt-2">Monthly / Yearly with 2 months free</p>

      <BillingToggle billing={billing} />
      <div className="mb-6 text-center text-xs text-slate-400">{billingNote}</div>

      <div className="mt-8 grid gap-6 md:grid-cols-4">
        {plans.map((p) => (
          <div key={p.id} className={`card p-6 ${p.popular ? 'ring-2 ring-brand/60' : ''}`}>
            {p.popular && <div className="mb-3 inline-flex rounded-full bg-brand-gradient px-2 py-1 text-xs">Most popular</div>}
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm font-medium text-slate-300">{p.name}</div>
                <div className="mt-1 flex items-baseline gap-1">
                  <div className="text-4xl font-extrabold">${priceFor(p)}</div>
                  <div className="text-sm text-slate-400">/ month</div>
                </div>
              </div>
            </div>
            <p className="mt-3 text-sm text-slate-300">{p.description}</p>
            <ul className="mt-4 grid gap-2 text-sm text-slate-300">
              {p.features.map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-brand" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <div className="mt-6">
              {p.monthly === 0 ? (
                <a href="/auth/signup" className="inline-flex w-full items-center justify-center rounded-xl px-4 py-3 bg-brand-gradient text-white font-medium">Get Started</a>
              ) : (
                <a href={`/checkout/subscribe?plan=${p.id}&billing=${billing}`} className="inline-flex w-full items-center justify-center rounded-xl px-4 py-3 bg-white/10 hover:bg-white/15 text-white font-medium">Continue</a>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="card p-6 mt-8">
        <h3 className="text-xl font-semibold">Need enterprise?</h3>
        <p className="mt-1 text-slate-300">Contact us for SSO, on-prem options, and custom SLAs.</p>
        <a className="text-white underline mt-2 inline-block" href="#demo">Request a custom quote</a>
      </div>

      <div className="mt-10">
        <h2 className="text-3xl font-bold text-center">Compare plans</h2>
        <p className="text-slate-300 text-center mt-1">Features by tier</p>
        <div className="overflow-hidden rounded-xl card mt-6">
          <table className="min-w-full divide-y divide-white/10">
            <thead className="bg-transparent">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-300">Feature</th>
                {plans.map((p) => (
                  <th key={p.id} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-300">{p.name}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10 bg-transparent text-sm text-slate-300">
              {[
                { k: 'Analyses / month', vals: ['10', '100', '1000', 'Unlimited*'] },
                { k: 'Ensemble detection', vals: ['—', '✓', '✓', '✓'] },
                { k: 'Team workspaces', vals: ['—', '—', '✓', '✓'] },
                { k: 'Advanced reports', vals: ['—', '—', '—', '✓'] },
                { k: 'Support', vals: ['Community', 'Email', 'Priority', 'Dedicated'] },
              ].map((row) => (
                <tr key={row.k}>
                  <td className="px-4 py-3 font-medium text-white">{row.k}</td>
                  {row.vals.map((v, i) => (
                    <td key={i} className="px-4 py-3">{v}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-2 text-xs text-slate-400">* Fair use limits may apply to ensure quality of service.</div>
      </div>

      <div className="mt-10">
        <h2 className="text-3xl font-bold text-center">Frequently asked questions</h2>
        <div className="grid gap-4 md:grid-cols-2 mt-6">
          {[
            { q: 'Can I change plans later?', a: 'Yes, you can upgrade or downgrade at any time. Changes take effect from your next billing cycle.' },
            { q: 'Do you offer refunds?', a: 'We offer a pro-rated refund if you cancel within 7 days of a new billing period.' },
            { q: 'Is there a free plan?', a: 'Yes — the Freemium plan lets you experiment with the detector with limited monthly analyses.' },
            { q: 'Do you support annual billing?', a: 'Yes — select Yearly for 2 months free (billed once per year).' },
          ].map((f) => (
            <div key={f.q} className="card p-4">
              <div className="font-medium">{f.q}</div>
              <p className="mt-1 text-sm text-slate-300">{f.a}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
