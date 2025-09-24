"use client";

import { Button } from '../../components/ui/button';
import { useRouter, useSearchParams } from 'next/navigation';

export default function BillingToggle({ billing }: { billing: 'monthly' | 'yearly' }) {
  const router = useRouter();
  const params = useSearchParams();

  function setBilling(next: 'monthly' | 'yearly') {
    const usp = new URLSearchParams(params as any);
    usp.set('billing', next);
    router.replace(`/pricing?${usp.toString()}`, { scroll: false });
  }

  return (
    <div className="mb-6 flex items-center justify-center gap-2">
      <Button variant={billing === 'monthly' ? 'primary' : 'secondary'} size="sm" onClick={() => setBilling('monthly')}>Monthly</Button>
      <Button variant={billing === 'yearly' ? 'primary' : 'secondary'} size="sm" onClick={() => setBilling('yearly')}>Yearly</Button>
    </div>
  );
}

