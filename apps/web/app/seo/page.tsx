"use client";

import { useState } from 'react';
import { Card, CardHeader } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Button } from '../../components/ui/button';

export default function SeoGeneratorPage() {
  const [keyword, setKeyword] = useState('');
  const [language, setLanguage] = useState<'en'>('en');
  const [words, setWords] = useState(1200);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setLoading(true);
    setError(null);
    setContent('');
    try {
      const res = await fetch('/api/seo/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword, language, words }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Generation failed');
      setContent(json.content || '');
    } catch (e: any) {
      setError(e?.message || 'Generation failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader title="SEO Article Generator" subtitle="Generate a human-quality article from a keyword using Llama 3.1 70B." />
        <div className="grid gap-3">
          <label className="text-sm font-medium">Keyword</label>
          <Input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="e.g. best productivity tips" />

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium">Language</label>
              <select className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm" value={language} onChange={(e) => setLanguage(e.target.value as 'en')}>
                <option value="en">English</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Target words (approx)</label>
              <Input type="number" min={600} max={2000} value={words} onChange={(e) => setWords(Number(e.target.value || 1200))} />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button onClick={generate} disabled={!keyword.trim() || loading}>{loading ? 'Generating…' : 'Generate'}</Button>
          </div>
          {error && <div className="text-sm text-red-600">{error}</div>}
        </div>
      </Card>

      <Card>
        <CardHeader title="Output" />
        <Textarea className="min-h-[320px]" value={content} onChange={(e) => setContent(e.target.value)} placeholder="Article will appear here" />
      </Card>
    </div>
  );
}

