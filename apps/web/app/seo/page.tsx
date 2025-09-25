"use client";

import { useState } from 'react';
import { Card, CardHeader } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Button } from '../../components/ui/button';
import toast from 'react-hot-toast';

export default function SeoGeneratorPage() {
  const [keyword, setKeyword] = useState('');
  const [language, setLanguage] = useState<'en'|'fr'|'de'|'es'|'it'|'pt'>('en');
  const [words, setWords] = useState(1200);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stream, setStream] = useState(true);

  async function generate() {
    setLoading(true);
    setError(null);
    setContent('');
    try {
      if (!keyword.trim()) {
        setError('Please enter a keyword');
        setLoading(false);
        return;
      }
      if (stream) {
        const res = await fetch('/api/seo/generate/stream', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ keyword, language, words }),
        });
        if (!res.ok || !res.body) throw new Error(await res.text());
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let full = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value);
          full += chunk;
          setContent((prev) => prev + chunk);
        }
        if (!full.trim()) throw new Error('Empty response');
      } else {
        const res = await fetch('/api/seo/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ keyword, language, words }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || 'Generation failed');
        setContent(json.content || '');
      }
    } catch (e: any) {
      setError(e?.message || 'Generation failed');
    } finally {
      setLoading(false);
    }
  }

  async function save() {
    if (!content.trim()) { toast.error('Nothing to save'); return; }
    const lines = content.split(/\r?\n/);
    let title = 'Generated Article';
    let start = 0;
    for (let i = 0; i < lines.length; i++) {
      const l = lines[i].trim();
      if (l.startsWith('# ')) { title = l.replace(/^#\s+/, '').trim() || title; start = i + 1; break; }
    }
    const body = lines.slice(start).join('\n').trim();
    try {
      const res = await fetch('/api/proxy/api/v1/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, body, language })
      });
      if (!res.ok) throw new Error(await res.text());
      toast.success('Saved to Content');
    } catch (e: any) {
      toast.error(e?.message || 'Save failed');
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
              <select
                className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
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
            <div>
              <label className="text-sm font-medium">Target words (approx)</label>
              <Input type="number" min={600} max={2000} value={words} onChange={(e) => setWords(Number(e.target.value || 1200))} />
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <label className="inline-flex items-center gap-2 text-sm text-slate-300">
              <input type="checkbox" checked={stream} onChange={(e) => setStream(e.target.checked)} /> Stream
            </label>
            <Button onClick={generate} disabled={loading}>{loading ? 'Generating…' : 'Generate'}</Button>
            <Button variant="secondary" onClick={save} disabled={!content.trim()}>Save to Content</Button>
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
