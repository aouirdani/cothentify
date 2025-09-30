'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';

import { Card, CardHeader } from '../../components/ui/card';
import { Textarea } from '../../components/ui/textarea';
import { Button } from '../../components/ui/button';
import { Gauge } from '../../components/ui/gauge';
import { Spinner } from '../../components/ui/spinner';

type AnalysisResponse = {
  ai_probability: number;
  confidence_score: number;
  detected_models?: string[];
  analysis_details?: {
    pattern_matches?: string[];
    linguistic_markers?: string[];
  };
  processing_time?: number;
};

type Suggestion = { title: string; detail: string };

export default function AiTextDetectionClient() {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);
  const [submitted, setSubmitted] = useState('');

  const suggestions = useMemo(() => (analysis && submitted ? buildSuggestions(submitted, analysis) : []), [analysis, submitted]);
  const humanizedDraft = useMemo(() => (submitted ? humanizeText(submitted) : ''), [submitted]);

  async function handleAnalyze() {
    const sample = text.trim();
    if (!sample) return;
    setLoading(true);
    setError(null);
    setAnalysis(null);
    try {
      const res = await fetch('/api/proxy/api/v1/content/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: sample, options: { detailed_analysis: true, language: 'en' } }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as AnalysisResponse;
      setAnalysis(json);
      setSubmitted(sample);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unable to analyze text right now.';
      setError(message);
      setSubmitted('');
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setText('');
    setAnalysis(null);
    setSubmitted('');
    setError(null);
  }

  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-brand-radial" />
      <section className="container grid gap-10 py-16 lg:grid-cols-[1.35fr,1fr]">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
            Check any draft with our
            <span className="bg-brand-gradient bg-clip-text text-transparent"> AI detection engine</span>
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-slate-200">
            Paste a sample below to see how likely it is to come from generative AI, where the signals appear, and how to humanize the tone before shipping.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-slate-300">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 uppercase tracking-wider">
              Ensemble detection | ~8s avg runtime
            </span>
            <Link href="/pricing" className="rounded-full border border-white/10 px-4 py-1.5 font-medium text-white/80 hover:text-white">
              Upgrade for bulk checks
            </Link>
          </div>
          <div className="mt-10 grid gap-4 text-sm text-slate-300">
            <p>Tips before you run the detector:</p>
            <ul className="grid gap-2 text-slate-400">
              <li>- At least 80 words produces more reliable signals.</li>
              <li>- Keep citations in place. We never store samples unless you opt in.</li>
              <li>- Confidence combines stylometry, burstiness, and model fingerprinting.</li>
            </ul>
          </div>
        </div>
        <Card className="relative overflow-hidden border-white/10 bg-black/60 p-6">
          <CardHeader title="Paste text to analyze" subtitle="We'll return AI probability, confidence, and remediation ideas." />
          <Textarea
            rows={12}
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="Paste content here..."
            className="min-h-[240px] bg-black/40"
          />
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button onClick={handleAnalyze} disabled={loading || !text.trim()}>
              {loading ? (
                <span className="inline-flex items-center gap-2"><Spinner /> Analyzing...</span>
              ) : (
                'Run detection'
              )}
            </Button>
            <Button variant="secondary" onClick={reset} disabled={loading && !analysis && !error}>
              Reset
            </Button>
            {error && <span className="text-sm text-red-400">{error}</span>}
          </div>
          <p className="mt-4 text-xs text-slate-500">
            Results are estimates. Make final calls with human judgment and your editorial policies.
          </p>
        </Card>
      </section>

      <section className="container pb-20">
        {analysis ? (
          <div className="grid gap-8 lg:grid-cols-[1.1fr,0.9fr]">
            <Card className="p-6">
              <CardHeader title="Detection summary" />
              <div className="grid gap-6 md:grid-cols-2">
                <div className="flex items-center justify-center">
                  <Gauge value={Number(analysis.ai_probability ?? 0)} />
                </div>
                <div className="space-y-3 text-sm">
                  {(() => {
                    const aiProbability = Number.isFinite(analysis.ai_probability) ? Number(analysis.ai_probability) : 0;
                    const confidence = Number.isFinite(analysis.confidence_score) ? Number(analysis.confidence_score) : 0;
                    return (
                      <>
                        <div>
                          <p className="text-slate-400">AI probability</p>
                          <p className="text-lg font-semibold text-white">{aiProbability.toFixed(1)}%</p>
                        </div>
                        <div>
                          <p className="text-slate-400">Confidence</p>
                          <p className="text-lg font-semibold text-white">{confidence.toFixed(1)}%</p>
                        </div>
                      </>
                    );
                  })()}
                  {Array.isArray(analysis.detected_models) && analysis.detected_models.length > 0 && (
                    <div>
                      <p className="text-slate-400">Likely model families</p>
                      <p className="text-sm text-slate-200">{analysis.detected_models.join(', ')}</p>
                    </div>
                  )}
                  {analysis.processing_time != null && (
                    <div className="text-xs text-slate-500">Processing time: {formatProcessingTime(analysis.processing_time)}</div>
                  )}
                </div>
              </div>
              {analysis.analysis_details && (
                <div className="mt-6 grid gap-3 text-xs text-slate-300">
                  <p className="font-medium uppercase tracking-widest text-slate-400">Signals we spotted</p>
                  <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <p className="text-slate-400">Pattern matches</p>
                    <p>{analysis.analysis_details.pattern_matches?.slice(0, 6).join(', ') || 'None detected'}</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <p className="text-slate-400">Linguistic markers</p>
                    <p>{analysis.analysis_details.linguistic_markers?.slice(0, 6).join(', ') || 'None detected'}</p>
                  </div>
                </div>
              )}
            </Card>

            <div className="grid gap-6">
              <Card className="p-6">
                <CardHeader title="Humanize action plan" subtitle="Quick wins to add voice and reduce AI fingerprints." />
                <ul className="grid gap-3 text-sm text-slate-200">
                  {suggestions.length > 0 ? (
                    suggestions.map((item) => (
                      <li key={item.title} className="rounded-xl border border-white/10 bg-white/5 p-4">
                        <p className="font-semibold">{item.title}</p>
                        <p className="mt-1 text-slate-300">{item.detail}</p>
                      </li>
                    ))
                  ) : (
                    <li className="rounded-xl border border-white/10 bg-white/5 p-4 text-slate-300">
                      Your sample already reads human and personal. Keep it up!
                    </li>
                  )}
                </ul>
              </Card>

              {humanizedDraft && (
                <Card className="p-6">
                  <CardHeader title="Humanized draft" subtitle="A quick rewrite applying the tips above." />
                  <pre className="max-h-72 overflow-auto rounded-xl bg-black/60 p-4 text-sm text-slate-100 whitespace-pre-wrap">
                    {humanizedDraft}
                  </pre>
                </Card>
              )}
            </div>
          </div>
        ) : (
          <Card className="grid place-items-center gap-3 border-dashed border-white/20 bg-black/30 py-16 text-center text-slate-400">
            <p className="text-lg font-semibold text-white">Run the detector to see scores & humanizing ideas.</p>
            <p className="max-w-md text-sm text-slate-400">
              We&apos;ll display AI probability, model fingerprints, and a refreshed version of your copy with warmer tone and varied cadence.
            </p>
          </Card>
        )}
      </section>
    </main>
  );
}

function buildSuggestions(text: string, analysis: AnalysisResponse): Suggestion[] {
  const suggestions: Suggestion[] = [];
  const sentences = splitSentences(text);
  const words = text.split(/\s+/).filter(Boolean);
  const averageSentenceLength = sentences.length ? Math.round(words.length / sentences.length) : words.length;
  const uniqueWords = new Set(words.map((w) => w.toLowerCase().replace(/[^a-z']/g, '')));
  const lexicalVariety = words.length ? (uniqueWords.size / words.length) * 100 : 0;

  if ((analysis.ai_probability ?? 0) >= 65) {
    suggestions.push({
      title: 'Infuse lived experience',
      detail: 'Add a short personal anecdote or tactile example to break up the neutral tone that detectors associate with AI-first drafts.',
    });
  }

  if (averageSentenceLength > 22) {
    suggestions.push({
      title: 'Shorten long sentences',
      detail: 'Several sentences exceed 22 words. Split them with connective cues ("Here\'s what stood out:"), or convert one into a question.',
    });
  }

  if (lexicalVariety < 42) {
    suggestions.push({
      title: 'Swap recurring phrases',
      detail: 'The detector spotted repeated wording. Replace corporate phrasing with conversational verbs or add sensory adjectives in one or two places.',
    });
  }

  const formalMatches = FORMAL_PHRASES.filter((phrase) => text.toLowerCase().includes(phrase));
  if (formalMatches.length > 0) {
    suggestions.push({
      title: 'Dial down formal boilerplate',
      detail: `Try replacing phrases like "${formalMatches.slice(0, 3).join('", "')}" with more direct language or first-person framing.`,
    });
  }

  if (analysis.confidence_score && analysis.confidence_score < 55) {
    suggestions.push({
      title: 'Add structure cues',
      detail: 'Confidence is moderate, so clarifying structure helps reviewers. Insert headings or bullet lists to make editorial voice explicit.',
    });
  }

  if (suggestions.length === 0 && (analysis.ai_probability ?? 0) > 40) {
    suggestions.push({
      title: 'Light personal tweaks',
      detail: "Even a single sentence with opinionated language (\"Here's why this matters to me...\") will lower AI probability on follow-up checks.",
    });
  }

  return suggestions;
}

function humanizeText(text: string): string {
  let draft = text;
  for (const [pattern, replacement] of HUMANIZE_REPLACEMENTS) {
    draft = draft.replace(pattern, replacement);
  }

  draft = draft.replace(/\b(as an AI|cutting-edge|holistic approach|leverage)\b/gi, (match) => HUMANIZE_SOFTENERS[match.toLowerCase()] ?? match);
  draft = draft.replace(/\s{2,}/g, ' ');
  draft = draft.trim();

  const sentences = splitSentences(draft);
  if (sentences.length === 0) return draft;

  const intro = "Here's how I'd phrase it after a quick polish:";
  const adjusted = sentences
    .map((sentence, index) => {
      let updated = sentence.trim();
      if (!updated) return '';

      if (index === 0 && !/^I\b|^We\b|^Let's\b/i.test(updated)) {
        updated = `I` + (updated.startsWith(' ') ? '' : ' ') + updated.charAt(0).toLowerCase() + updated.slice(1);
      }

      if (updated.endsWith(',')) {
        updated = `${updated.slice(0, -1)}.`;
      }

      return updated;
    })
    .filter(Boolean)
    .join(' ');

  return `${intro}\n\n${adjusted}`;
}

function splitSentences(text: string): string[] {
  return text
    .split(/[.!?]+\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

function formatProcessingTime(value: number): string {
  if (!Number.isFinite(value)) return 'N/A';
  return value >= 1 ? `${value.toFixed(2)}s` : `${(value * 1000).toFixed(0)}ms`;
}

const FORMAL_PHRASES = [
  'in conclusion',
  'furthermore',
  'moreover',
  'additionally',
  'utilize',
  'leverage',
  'cutting-edge',
  'state-of-the-art',
  'comprehensive solution',
];

const HUMANIZE_REPLACEMENTS: Array<[RegExp, string]> = [
  [/\butilize\b/gi, 'use'],
  [/\bleverage\b/gi, 'use'],
  [/\bendeavor\b/gi, 'try'],
  [/\btherefore\b/gi, 'so'],
  [/\bexpedite\b/gi, 'speed up'],
  [/\bholistic\b/gi, 'well-rounded'],
  [/\bbeneath the surface\b/gi, 'behind the scenes'],
];

const HUMANIZE_SOFTENERS: Record<string, string> = {
  'as an ai': 'from what I\'ve seen',
  'cutting-edge': 'new',
  'holistic approach': 'well-rounded approach',
  leverage: 'use',
};
