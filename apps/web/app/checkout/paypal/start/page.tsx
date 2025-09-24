"use client";

export const dynamic = 'force-dynamic';

import { Suspense, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

export default function PaypalStartPage() {
  return (
    <Suspense fallback={null}>
      <StartInner />
    </Suspense>
  );
}

function StartInner() {
  const sp = useSearchParams();
  useEffect(() => {
    (async () => {
      const plan = sp.get('plan') || 'essential';
      const billing = sp.get('billing') || 'monthly';
      try {
        const res = await fetch('/api/paypal/create', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ plan, billing })
        });
        const data = await res.json();
        if (!res.ok || !data?.approveUrl) throw new Error(data?.error || 'PayPal create failed');
        window.location.replace(data.approveUrl as string);
      } catch {
        window.close();
      }
    })();
  }, [sp]);
  return null;
}
