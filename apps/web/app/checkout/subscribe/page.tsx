"use client";

import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense, useState } from 'react';
import { Card, CardHeader } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { Button } from '../../../components/ui/button';
import toast from 'react-hot-toast';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function SubscribePage() {
  return (
    <Suspense fallback={null}>
      <SubscribeInner />
    </Suspense>
  );
}

function SubscribeInner() {
  const sp = useSearchParams();
  const router = useRouter();
  const plan = sp.get('plan') || 'essential';
  const billing = sp.get('billing') || 'monthly';
  const { amount, currency } = (() => {
    try {
      const { getPriceUSD } = require('../../../lib/payments');
      return getPriceUSD(plan, billing);
    } catch {
      return { amount: 0, currency: 'USD' };
    }
  })();
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [agree, setAgree] = useState(false);
  const [loading, setLoading] = useState(false);

  async function payWithCard() {
    if (!agree) { toast.error('Please accept terms'); return; }
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, billing, email }),
      });
      const data = await res.json();
      if (!res.ok || !data?.url) throw new Error(data?.error || 'Checkout failed');
      window.location.href = data.url as string;
    } catch (e: any) {
      toast.error(e?.message || 'Checkout failed');
    }
  }

  function payWithPayPal() {
    if (!agree) { toast.error('Please accept terms'); return; }
    const url = new URL('/checkout/paypal/start', window.location.origin);
    url.searchParams.set('plan', plan);
    url.searchParams.set('billing', billing);
    const width = 600;
    const height = 700;
    const left = Math.round(window.screenX + (window.outerWidth - width) / 2);
    const top = Math.round(window.screenY + (window.outerHeight - height) / 2);
    const features = `popup=yes,toolbar=no,location=no,status=no,menubar=no,scrollbars=yes,resizable=yes,width=${width},height=${height},left=${left},top=${top}`;
    const win = window.open(url.toString(), 'paypal_checkout', features);
    if (!win) return;
    const timer = setInterval(() => {
      if (win.closed) { clearInterval(timer); return; }
      try {
        const href = win.location.href;
        if (href.startsWith(window.location.origin)) {
          clearInterval(timer);
          window.location.href = href;
          win.close();
        }
      } catch {}
    }, 500);
  }

  return (
    <div className="mx-auto grid max-w-2xl gap-6">
      <Card>
        <CardHeader title="Subscription details" subtitle="Tell us a bit about you" />
        <div className="grid gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium">Full name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Company (optional)</label>
            <Input value={company} onChange={(e) => setCompany(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Billing email</label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <label className="flex items-start gap-2 text-sm text-slate-600">
            <input type="checkbox" className="mt-1" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
            I agree to the <a className="text-blue-600 underline" href="/terms">Terms</a> and <a className="text-blue-600 underline" href="/privacy">Privacy Policy</a>.
          </label>
        </div>
      </Card>

      <Card>
        <CardHeader title="Payment" subtitle={`Plan: ${plan.toUpperCase()} • Billing: ${billing.toUpperCase()} • Price: ${amount.toFixed(2)} ${currency}${billing === 'yearly' ? ' / yr' : ' / mo'}`} />
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button onClick={payWithCard}>Pay with card</Button>
          <Button variant="secondary" onClick={payWithPayPal}>Pay with PayPal</Button>
        </div>
      </Card>
    </div>
  );
}
