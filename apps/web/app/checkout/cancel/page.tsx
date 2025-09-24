"use client";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

import Link from 'next/link';
import { Card, CardHeader } from '../../../components/ui/card';

export default function CancelPage() {
  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader title="Checkout canceled" subtitle="You can resume anytime." />
        <p className="text-sm text-slate-700">No charges were made. Feel free to explore features and upgrade later.</p>
        <div className="mt-4 flex gap-4">
          <Link className="text-blue-600 underline" href="/pricing">Back to pricing</Link>
          <Link className="text-blue-600 underline" href="/dashboard">Go to dashboard</Link>
        </div>
      </Card>
    </div>
  );
}
