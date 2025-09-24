"use client";

import { useMemo, useState } from 'react';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import toast from 'react-hot-toast';

type Props = {
  plan: 'essential' | 'premium' | 'professional';
  billing: 'monthly' | 'yearly';
  payer: { name: string; company?: string; email: string };
  agree: boolean;
};

export default function StripeInline({ plan, billing, payer, agree }: Props) {
  const stripePromise = useMemo(() => loadStripe(process.env['NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY'] || ''), []);
  return (
    <Elements stripe={stripePromise} options={{ appearance: { theme: 'stripe' } }}>
      <StripeForm plan={plan} billing={billing} payer={payer} agree={agree} />
    </Elements>
  );
}

function StripeForm({ plan, billing, payer, agree }: Props) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [nameOnCard, setNameOnCard] = useState('');
  const [line1, setLine1] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postal, setPostal] = useState('');
  const [country, setCountry] = useState('');

  async function pay() {
    if (!agree) { toast.error('Please accept terms'); return; }
    if (!stripe || !elements) return;
    setLoading(true);
    try {
      const res = await fetch('/api/stripe/create-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, billing, email: payer.email, name: payer.name }),
      });
      const data = await res.json();
      if (!res.ok || !data?.clientSecret) throw new Error(data?.error || 'Failed to start payment');
      const clientSecret: string = data.clientSecret;

      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement)!,
          billing_details: {
            name: nameOnCard || payer.name,
            email: payer.email,
            address: { line1, city, state, postal_code: postal, country },
          },
        },
      });

      if (result.error) {
        toast.error(result.error.message || 'Payment failed');
      } else if (result.paymentIntent?.status === 'succeeded' || result.paymentIntent?.status === 'requires_capture' || result.paymentIntent?.status === 'processing') {
        const url = new URL('/checkout/success', window.location.origin);
        url.searchParams.set('plan', plan);
        url.searchParams.set('billing', billing);
        url.searchParams.set('provider', 'stripe');
        window.location.href = url.toString();
      } else {
        toast('Payment status: ' + result.paymentIntent?.status);
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      toast.error(msg || 'Payment failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium">Name on card</label>
          <Input value={nameOnCard} onChange={(e) => setNameOnCard(e.target.value)} placeholder="John Doe" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Address line 1</label>
          <Input value={line1} onChange={(e) => setLine1(e.target.value)} placeholder="123 Main St" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">City</label>
          <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">State/Region</label>
          <Input value={state} onChange={(e) => setState(e.target.value)} placeholder="State" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Postal code</label>
          <Input value={postal} onChange={(e) => setPostal(e.target.value)} placeholder="12345" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Country</label>
          <Input value={country} onChange={(e) => setCountry(e.target.value)} placeholder="US" />
        </div>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Card details</label>
        <div className="rounded-md border p-3">
          <CardElement options={{ hidePostalCode: true }} />
        </div>
      </div>
      <div>
        <Button onClick={pay} disabled={loading || !stripe || !elements}>{loading ? 'Processing…' : 'Pay with card'}</Button>
      </div>
    </div>
  );
}
