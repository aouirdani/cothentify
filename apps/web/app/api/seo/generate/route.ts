import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type Provider = 'deepinfra' | 'together' | 'groq' | 'openai' | 'custom' | 'ollama';
const LANGS = ['en','fr','de','es','it','pt'] as const;
type Lang = typeof LANGS[number];

function getApiConfig() {
  const provider = (process.env['LLM_PROVIDER'] as Provider) || 'deepinfra';
  const apiKey = process.env['LLM_API_KEY'] || '';
  const model = process.env['LLM_MODEL'] || 'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo';
  let base = process.env['LLM_API_BASE'] || '';
  if (!base) {
    base = provider === 'deepinfra'
      ? 'https://api.deepinfra.com/v1/openai'
      : provider === 'together'
      ? 'https://api.together.xyz/v1'
      : provider === 'groq'
      ? 'https://api.groq.com/openai/v1'
      : provider === 'ollama'
      ? 'http://localhost:11434'
      : 'https://api.openai.com/v1';
  }
  return { base, apiKey, model };
}

const BodySchema = z.object({
  keyword: z.string().min(1),
  language: z.string().optional(),
  words: z.union([z.number(), z.string()]).optional(),
});

export async function POST(req: NextRequest) {
  const parsed = BodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid body', details: parsed.error.flatten() }, { status: 400 });
  }
  const keyword = parsed.data.keyword.trim();
  const language = (parsed.data.language ?? 'en').toLowerCase();
  const wordsRaw = parsed.data.words;
  const wordsNumber = typeof wordsRaw === 'string' ? Number(wordsRaw) : wordsRaw;
  const targetWords = Math.max(600, Math.min(2000, Number.isFinite(wordsNumber) ? Number(wordsNumber) : 1200));
  if (!keyword) return NextResponse.json({ error: 'Missing keyword' }, { status: 400 });
  if (!LANGS.includes(language as Lang)) {
    return NextResponse.json({ error: 'Invalid language', allowed: LANGS }, { status: 400 });
  }

  const { base, apiKey, model } = getApiConfig();
  const overrideKey = req.headers.get('x-llm-api-key') || undefined;
  const key = overrideKey || apiKey;
  if (!key && (process.env['LLM_PROVIDER'] as Provider) !== 'ollama')
    return NextResponse.json({ error: 'LLM not configured (set LLM_API_KEY for provider)' }, { status: 400 });

  // Simple OpenAI-compatible chat/completions call
  const sys = `You are an expert human SEO content writer.
Write a helpful, original, and engaging long-form article in ${language.toUpperCase()} that genuinely reads like it was written by a professional human.

Hard requirements:
- Length: ~${targetWords} words (±10%).
- Style: clear, concise, and actionable; avoid filler, clichés, or obvious AI phrasing.
- Use Markdown formatting with proper headings (# for H1, ## for H2, ### for H3).
- Include, at the very top (before the body):
  1) Meta Title (≤ 60 chars)
  2) Meta Description (≤ 160 chars)
  3) Slug (kebab-case)
  4) TL;DR (1–2 sentences)
- Provide a structured outline with H2s and H3s.
- Article body: compelling intro, well-structured sections, and a practical conclusion with a clear call-to-action.
- Add a short FAQ (5 Q&As) at the end.
- Suggest 3–5 internal link anchor ideas and 3–5 external reputable sources (as a list, do not fabricate URLs).
- Add a small list of key terms and semantic variations used.
- Do not mention that you are an AI model; avoid generic disclaimers.
`;
  const usr = `Main keyword: ${keyword}\nLanguage: ${language}\nGoal: Generate an SEO-ready, human-sounding article with the above structure.`;

  try {
    if ((process.env['LLM_PROVIDER'] as Provider) === 'ollama') {
      const res = await fetch(`${base}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          prompt: `${sys}\n\n${usr}`,
          options: { temperature: 0.7 },
          stream: false,
        }),
      });
      if (!res.ok) {
        const txt = await res.text();
        return NextResponse.json({ error: `LLM error: ${txt}` }, { status: 500 });
      }
      const json = await res.json();
      const content = json?.response || '';
      return NextResponse.json({ content, model });
    } else {
      const res = await fetch(`${base}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: sys },
            { role: 'user', content: usr },
          ],
          temperature: 0.7,
          top_p: 0.95,
          max_tokens: 4096,
        }),
      });
      if (!res.ok) {
        const txt = await res.text();
        return NextResponse.json({ error: `LLM error: ${txt}` }, { status: 500 });
      }
      const json = await res.json();
      const content = json?.choices?.[0]?.message?.content || '';
      return NextResponse.json({ content, model });
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
