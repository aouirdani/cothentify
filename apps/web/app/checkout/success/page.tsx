"use client";

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardHeader } from '../../../components/ui/card';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';

export const dynamic = 'force-dynamic';

export default function SuccessPage() {
  return (
    <Suspense fallback={null}>
      <SuccessInner />
    </Suspense>
  );
}

function SuccessInner() {
  const params = useSearchParams();
  const plan = params.get('plan');
  const mock = params.get('mock');
  const { status } = useSession();
  const [activated, setActivated] = useState(false);

  useEffect(() => {
    async function activate() {
      if (!plan || activated || status !== 'authenticated') return;
      try {
        const res = await fetch('/api/proxy/api/v1/billing/activate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ plan: plan.toUpperCase() })
        });
        if (res.ok) {
          setActivated(true);
          toast.success('Subscription activated');
        }
      } catch {}
    }
    activate();
  }, [plan, status, activated]);

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader title="Payment successful" subtitle={mock ? 'Mock success (test mode)' : 'Thank you for your purchase!'} />
        <p className="text-sm text-slate-700">Your subscription {plan ? `(${plan}) ` : ''}is now active. You can manage content and access premium features from your dashboard.</p>
        <div className="mt-4">
          <Link className="text-blue-600 underline" href="/dashboard">Go to dashboard</Link>
        </div>
      </Card>
    </div>
  );
}
