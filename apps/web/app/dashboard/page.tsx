'use client';

import { useState } from 'react';
import { signIn, signOut, useSession } from 'next-auth/react';
import { Card, CardHeader } from '../../components/ui/card';
import { Textarea } from '../../components/ui/textarea';
import { Button } from '../../components/ui/button';
import { Gauge } from '../../components/ui/gauge';
import toast from 'react-hot-toast';
import { Spinner } from '../../components/ui/spinner';
import { motion } from 'framer-motion';
import { useEffect } from 'react';
import useSWR from 'swr';
import { Skeleton } from '../../components/ui/skeleton';
import { useI18n } from '../../components/LocaleProvider';

export default function DashboardPage() {
  const { t } = useI18n();
  const { data: session, status } = useSession();
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const hfEnabled = (process.env.NEXT_PUBLIC_ENABLE_HF_DETECTOR || 'false') === 'true';
  const fetcher = (u: string) => fetch(u).then(r => r.json());
  const { data: me, isLoading: meLoading, mutate: mutateMe } = useSWR(status === 'authenticated' ? '/api/proxy/api/v1/me' : null, fetcher);
  const plan = me?.plan || null;
  const subInfo = me?.subscription || null;

  async function downgrade() {
    try {
      const res = await fetch('/api/proxy/api/v1/billing/activate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ plan: 'FREEMIUM' })
      });
      if (res.ok) { await mutateMe(); toast.success('Downgraded to FREEMIUM'); }
      else { toast.error('Could not change plan'); }
    } catch { toast.error('Could not change plan'); }
  }

  function checkout(planId: 'essential'|'premium'|'professional', billing: 'monthly'|'yearly'='monthly') {
    window.location.href = `/checkout/start?plan=${planId}&billing=${billing}`;
  }

  async function analyze() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch(`/api/proxy/api/v1/content/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: text, options: { detailed_analysis: true, language: 'en' } }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setResult(json);
      toast.success('Analysis completed');
    } catch (e: any) {
      const msg = e?.message || 'Request failed';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-6">
      {status === 'authenticated' && (
        <Card>
          <CardHeader title="Subscription" subtitle="Your current plan and quick actions" />
          <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
            <div className="text-slate-700">
              <div>Current plan: <b>{meLoading ? 'Loading…' : (plan || '—')}</b></div>
              {meLoading ? (
                <div className="mt-1"><Skeleton className="h-3 w-48" /></div>
              ) : subInfo ? (
                <div className="text-xs text-slate-600">Status: {subInfo.status || '—'}{subInfo.billingCycle ? ` • ${subInfo.billingCycle}` : ''}{subInfo.currentPeriodEnd ? ` • Renews: ${new Date(subInfo.currentPeriodEnd).toLocaleDateString()}` : ''}</div>
              ) : null}
            </div>
            <div className="flex items-center gap-2">
              <a href="/pricing"><Button variant="secondary" size="sm">Manage plan</Button></a>
              <Button variant="secondary" size="sm" onClick={downgrade}>Downgrade to Freemium</Button>
              <Button size="sm" onClick={() => checkout('essential')}>Upgrade to Essential</Button>
              <Button size="sm" onClick={() => checkout('premium')}>Premium</Button>
              <Button size="sm" onClick={() => checkout('professional')}>Professional</Button>
            </div>
          </div>
        </Card>
      )}
      <Card>
        <CardHeader title="AI Detection — Quick Test" subtitle="Paste text and analyze with the ensemble detector." />
        <div className="mb-4 flex items-center justify-between text-sm">
          <div className="text-slate-600">HF Detector: <b className={hfEnabled ? 'text-green-600' : 'text-slate-600'}>{hfEnabled ? 'On' : 'Off'}</b></div>
          {status === 'authenticated' ? (
            <>
              <div className="flex items-center gap-3">
                <span className="text-gray-600">Signed in as {session?.user?.email}</span>
                <Button variant="secondary" size="sm" onClick={() => signOut()}>Sign out</Button>
              </div>
            </>
          ) : (
            <Button variant="secondary" size="sm" onClick={() => signIn()}>{t('auth.signin')}</Button>
          )}
        </div>
        <Textarea rows={10} placeholder="Paste content to analyze..." value={text} onChange={(e) => setText(e.target.value)} />
        <div className="mt-4 flex items-center gap-3">
          <Button onClick={analyze} disabled={loading || !text.trim()}>
            {loading ? (<span className="inline-flex items-center gap-2"><Spinner /> Analyzing...</span>) : 'Analyze'}
          </Button>
          {error && <span className="text-sm text-red-600">{error}</span>}
        </div>
      </Card>

      {result && (
        <Card>
          <CardHeader title="Result" />
          <div className="grid gap-6 md:grid-cols-2">
            <div className="flex items-center justify-center">
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.3 }}>
                <Gauge value={Number(result.ai_probability || 0)} />
              </motion.div>
            </div>
            <div className="text-sm">
              <div className="mb-1">AI Probability: <b>{result.ai_probability}%</b></div>
              <div className="mb-3">Confidence: <b>{result.confidence_score}%</b></div>
              {Array.isArray(result.detected_models) && result.detected_models.length > 0 && (
                <div className="mb-3">Detected Models: {result.detected_models.join(', ')}</div>
              )}
              {result.analysis_details && (
                <div className="grid gap-2">
                  <div className="font-medium">Signals</div>
                  <div className="text-xs text-slate-600">Patterns: {result.analysis_details.pattern_matches?.slice(0,5).join(', ') || '—'}</div>
                  <div className="text-xs text-slate-600">Markers: {result.analysis_details.linguistic_markers?.slice(0,5).join(', ') || '—'}</div>
                </div>
              )}
              <div className="mt-3">
                <div className="mb-2 font-medium">Raw response</div>
                <pre className="max-h-64 overflow-auto rounded bg-slate-50 p-3 text-xs">{JSON.stringify(result, null, 2)}</pre>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Usage card */}
      {status === 'authenticated' && (
        <UsageCard />
      )}
    </div>
  );
}

function UsageBar({ value, max }: { value: number; max: number }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div className="h-2 w-full rounded bg-slate-200">
      <div className="h-2 rounded bg-brand" style={{ width: `${pct}%` }} />
    </div>
  );
}

function planLimit(plan: string | null | undefined) {
  switch (plan) {
    case 'ESSENTIAL':
      return 100;
    case 'PREMIUM':
      return 1000;
    case 'PROFESSIONAL':
      return Number.POSITIVE_INFINITY;
    default:
      return 10;
  }
}

function UsageCard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<{ analysesThisMonth: number; analysesTotal: number } | null>(null);
  const { data: session } = useSession();
  const [plan, setPlan] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res1 = await fetch('/api/proxy/api/v1/stats/usage');
        if (!res1.ok) throw new Error('Failed to load usage');
        const json1 = await res1.json();
        setData(json1);
        const res2 = await fetch('/api/proxy/api/v1/me');
        const json2 = await res2.json();
        setPlan(json2?.plan || null);
      } catch (e: any) {
        setError(e?.message || 'Failed to load');
      } finally {
        setLoading(false);
      }
    }
    if (session?.user) load();
  }, [session]);

  const limit = planLimit(plan);

  return (
    <Card>
      <CardHeader title="Usage" subtitle="Analysis volume for this month" />
      {loading ? (
        <div className="text-sm text-slate-600">Loading...</div>
      ) : error ? (
        <div className="text-sm text-red-600">{error}</div>
      ) : data ? (
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <div>{data.analysesThisMonth} / {Number.isFinite(limit) ? limit : '∞'} analyses</div>
            <div className="text-xs text-slate-600">Total: {data.analysesTotal}</div>
          </div>
          {Number.isFinite(limit) && <UsageBar value={data.analysesThisMonth} max={limit} />}
          {!Number.isFinite(limit) && <div className="text-xs text-slate-600">Unlimited plan</div>}
        </div>
      ) : null}
    </Card>
  );
}
