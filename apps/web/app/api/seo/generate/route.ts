import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type Provider = 'deepinfra' | 'together' | 'groq' | 'openai' | 'custom' | 'ollama';

function getApiConfig() {
  const provider = (process.env['LLM_PROVIDER'] as Provider) || 'deepinfra';
  const apiKey = process.env['LLM_API_KEY'] || '';
  const model = process.env['LLM_MODEL'] || 'meta-llama/Meta-Llama-3.1-70B-Instruct';
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

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const keyword = String(body?.keyword || '').trim();
  const language = String(body?.language || 'en');
  const targetWords = Math.max(600, Math.min(2000, Number(body?.words || 1200)));
  if (!keyword) return NextResponse.json({ error: 'Missing keyword' }, { status: 400 });

  const { base, apiKey, model } = getApiConfig();
  if (!apiKey && (process.env['LLM_PROVIDER'] as Provider) !== 'ollama')
    return NextResponse.json({ error: 'LLM not configured (set LLM_API_KEY for provider)' }, { status: 400 });

  // Simple OpenAI-compatible chat/completions call
  const sys = `You are an expert SEO copywriter. Write natural, human-sounding articles that are helpful and well-structured. Avoid generic fluff and AI tells. Include:
  - A compelling H1 title with the main keyword
  - A short meta title and meta description (<= 160 chars)
  - An outline with H2/H3s
  - The full article body (~${targetWords} words), with factual, clear explanations
  - Use ${language.toUpperCase()} language.
  - Do not mention that you are an AI.`;
  const usr = `Main keyword: ${keyword}`;

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
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: sys },
            { role: 'user', content: usr },
          ],
          temperature: 0.7,
          max_tokens: 2048,
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
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 });
  }
}
