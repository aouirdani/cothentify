"use client";

import { Suspense, useState } from 'react';
import { signIn } from 'next-auth/react';
import { useSearchParams, useRouter } from 'next/navigation';
import type { Route } from 'next';
import { Card, CardHeader } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { Button } from '../../../components/ui/button';
import toast from 'react-hot-toast';

export const dynamic = 'force-dynamic';

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginInner />
    </Suspense>
  );
}

function LoginInner() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const search = useSearchParams();
  const router = useRouter();
  const callbackUrl = search.get('callbackUrl') || '/dashboard';

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await signIn('credentials', { email, password, redirect: false, callbackUrl });
    setLoading(false);
    if (res?.error) {
      toast.error('Invalid credentials');
    } else {
      toast.success('Signed in');
      router.push(callbackUrl as Route);
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <Card>
        <CardHeader title="Sign in" subtitle="Access your account" />
        <form onSubmit={submit} className="grid gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium">Email</label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Password</label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <Button type="submit" disabled={loading}>{loading ? 'Signing in…' : 'Sign in'}</Button>
        </form>
        <div className="mt-3 text-sm">
          <a className="text-blue-600 underline" href="/auth/signup">Need an account? Sign up</a>
        </div>
      </Card>
    </div>
  );
}
