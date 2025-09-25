
'use client';

import { useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';
import { TableSkeleton } from '../../components/ui/skeleton';
import { signIn, useSession } from 'next-auth/react';
import { Card, CardHeader } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Button } from '../../components/ui/button';
import toast from 'react-hot-toast';
import { useI18n } from '../../components/LocaleProvider';

type ContentListItem = {
  id: string;
  title: string;
  language: string;
  status: string;
  createdAt: string;
};

export default function ContentPage() {
  const { t } = useI18n();
  const { status } = useSession();
  const [items, setItems] = useState<ContentListItem[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pageSize] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [language, setLanguage] = useState<'en'|'fr'|'de'|'es'|'it'|'pt'>('en');
  const [body, setBody] = useState('');

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total, pageSize]);

  const fetcher = (url: string) => fetch(url).then((r) => r.json());
  const { data, error: swrError, isLoading, mutate } = useSWR(
    status === 'authenticated' ? `/api/proxy/api/v1/content?page=${page}&pageSize=${pageSize}` : null,
    fetcher,
    { revalidateOnFocus: false }
  );
  useEffect(() => {
    if (data) {
      setItems(data.items || []);
      setTotal(data.total || 0);
    }
  }, [data]);

  async function createItem() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/proxy/api/v1/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, body, language }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setTitle('');
      setBody('');
      await mutate();
      setPage(1);
      toast.success('Content created');
    } catch (e: any) {
      const msg = e?.message || 'Failed to create';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  async function enqueue(id: string) {
    setError(null);
    try {
      const res = await fetch(`/api/proxy/api/v1/content/${id}/analyze`, { method: 'POST' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      toast.success('Analysis enqueued');
    } catch (e: any) {
      const msg = e?.message || 'Failed to enqueue';
      setError(msg);
      toast.error(msg);
    }
  }

  // SWR handles fetching based on `page` and auth status

  if (status === 'unauthenticated') {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader title="Authentication required" />
          <div className="flex items-center gap-3">
            <p className="text-slate-700">Please sign in to view content.</p>
            <Button variant="secondary" size="sm" onClick={() => signIn()}>Sign in</Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader title={t('content.createTitle')} subtitle="Draft a new content piece and save it." />
        <div className="grid gap-3">
          <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <div className="flex gap-3 items-center">
            <label className="text-sm text-slate-600">{t('content.language')}</label>
            <select
              className="w-40 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
              value={language}
              onChange={(e) => setLanguage(e.target.value as typeof language)}
            >
              <option value="en">English</option>
              <option value="fr">Français</option>
              <option value="de">Deutsch</option>
              <option value="es">Español</option>
              <option value="it">Italiano</option>
              <option value="pt">Português</option>
            </select>
          </div>
          <Textarea placeholder={t('content.body')} value={body} onChange={(e) => setBody(e.target.value)} />
          <div>
            <Button disabled={!title.trim() || !body.trim() || loading} onClick={createItem}>
              {loading ? 'Saving...' : t('content.createBtn')}
            </Button>
          </div>
          {error && <div className="text-sm text-red-600">{error}</div>}
        </div>
      </Card>

      <Card>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{t('content.contentList')}</h2>
          <div className="text-sm text-slate-600">{t('content.pageOf').replace('{{page}}', String(page)).replace('{{total}}', String(totalPages))}</div>
        </div>
        {isLoading ? (
          <TableSkeleton rows={6} />
        ) : (
          <div className="overflow-hidden rounded-lg border">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Title</th>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Language</th>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Status</th>
                <th className="px-4 py-2 text-right text-xs font-semibold uppercase tracking-wider text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
            {items.map((it) => (
              <tr key={it.id}>
                  <td className="px-4 py-2 text-sm font-medium text-slate-900">{it.title}</td>
                  <td className="px-4 py-2 text-sm text-slate-700">{it.language}</td>
                  <td className="px-4 py-2 text-sm text-slate-700">{it.status}</td>
                  <td className="px-4 py-2 text-right">
                    <Button variant="secondary" size="sm" onClick={() => enqueue(it.id)}>Enqueue Analysis</Button>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td className="px-4 py-6 text-center text-sm text-slate-600" colSpan={4}>{t('content.noContent')}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        )}
        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-slate-600">Total: {total}</div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => { setPage((p) => Math.max(1, p - 1)); }}>{t('content.prev')}</Button>
            <Button variant="secondary" size="sm" disabled={page >= totalPages} onClick={() => { setPage((p) => p + 1); }}>{t('content.next')}</Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
