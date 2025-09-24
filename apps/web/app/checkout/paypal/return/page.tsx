"use client";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { Suspense, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

export default function PaypalReturnPage() {
  return (
    <Suspense fallback={null}>
      <ReturnInner />
    </Suspense>
  );
}

function ReturnInner() {
  const sp = useSearchParams();
  useEffect(() => {
    (async () => {
      const token = sp.get('token'); // PayPal returns token=orderId
      const plan = sp.get('plan') || '';
      const billing = sp.get('billing') || '';
      if (!token) { window.location.href = '/checkout/cancel?reason=no_token'; return; }
      try {
        const cap = await fetch('/api/paypal/capture', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ orderId: token })
        });
        if (!cap.ok) { window.location.href = '/checkout/cancel?reason=capture_failed'; return; }
      } catch {
        window.location.href = '/checkout/cancel?reason=capture_error'; return;
      }
      const url = new URL('/checkout/success', window.location.origin);
      if (plan) url.searchParams.set('plan', plan);
      if (billing) url.searchParams.set('billing', billing);
      url.searchParams.set('provider', 'paypal');
      window.location.href = url.toString();
    })();
  }, [sp]);
  return null;
}

