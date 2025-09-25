"use client";

import { Suspense, useState } from 'react';
import { signIn } from 'next-auth/react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardHeader } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { Button } from '../../../components/ui/button';
import toast from 'react-hot-toast';
import { useI18n } from '../../../components/LocaleProvider';

export const dynamic = 'force-dynamic';

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginInner />
    </Suspense>
  );
}

function LoginInner() {
  const { t } = useI18n();
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
      router.push(callbackUrl);
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <Card>
        <CardHeader title={t('auth.signin')} subtitle="Access your account" />
        <form onSubmit={submit} className="grid gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium">{t('auth.email')}</label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">{t('auth.password')}</label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <Button type="submit" disabled={loading}>{loading ? t('auth.signingin') : t('auth.signin')}</Button>
        </form>
        <div className="mt-3 text-sm">
          <a className="text-blue-600 underline" href="/auth/signup">{t('auth.needAccount')}</a>
        </div>
      </Card>
    </div>
  );
}
