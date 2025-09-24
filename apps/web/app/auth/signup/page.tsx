"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { Button } from '../../../components/ui/button';
import toast from 'react-hot-toast';

export default function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/proxy/api/v1/auth/register', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, name }),
      });
      if (!res.ok) throw new Error('Registration failed');
      toast.success('Account created. Please sign in.');
      router.push('/auth/login');
    } catch (e: any) {
      toast.error(e?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <Card>
        <CardHeader title="Create account" subtitle="Start your Cothentify trial" />
        <form onSubmit={submit} className="grid gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium">Full name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Work email</label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Password</label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <Button type="submit" disabled={loading}>{loading ? 'Creating…' : 'Sign up'}</Button>
        </form>
        <div className="mt-3 text-sm">
          <a className="text-blue-600 underline" href="/auth/login">Have an account? Sign in</a>
        </div>
      </Card>
    </div>
  );
}

