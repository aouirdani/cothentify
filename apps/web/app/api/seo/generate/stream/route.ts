import { NextRequest } from 'next/server';
import { z } from 'zod';

type Provider = 'deepinfra' | 'together' | 'groq' | 'openai' | 'custom' | 'ollama';

function getConfig() {
  const provider = (process.env['LLM_PROVIDER'] as Provider) || 'deepinfra';
  const apiKey = process.env['LLM_API_KEY'] || '';
  const model = process.env['LLM_MODEL'] || 'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo';
  let base = process.env['LLM_API_BASE'] || '';
  if (!base) {
    base =
      provider === 'deepinfra'
        ? 'https://api.deepinfra.com/v1/openai'
        : provider === 'together'
        ? 'https://api.together.xyz/v1'
        : provider === 'groq'
        ? 'https://api.groq.com/openai/v1'
        : provider === 'ollama'
        ? 'http://localhost:11434'
        : 'https://api.openai.com/v1';
  }
  return { provider, base, apiKey, model } as const;
}

const BodySchema = z.object({
  keyword: z.string().min(1),
  language: z.string().optional(),
  words: z.union([z.number(), z.string()]).optional(),
});

export async function POST(req: NextRequest) {
  const parsed = BodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return new Response('Invalid body', { status: 400 });
  }
  const keyword = parsed.data.keyword.trim();
  const language = (parsed.data.language ?? 'en').toLowerCase();
  const wordsRaw = parsed.data.words;
  const wordsValue = typeof wordsRaw === 'string' ? Number(wordsRaw) : wordsRaw;
  const words = Math.max(600, Math.min(2000, Number.isFinite(wordsValue) ? Number(wordsValue) : 1200));
  if (!keyword) return new Response('Missing keyword', { status: 400 });

  const { provider, base, apiKey, model } = getConfig();
  if (provider !== 'ollama' && !apiKey) return new Response('LLM not configured (set LLM_API_KEY)', { status: 400 });

  const sys = `You are an expert human SEO content writer.
Write a helpful, original, and engaging long-form article in ${language.toUpperCase()} that genuinely reads like it was written by a professional human.

Hard requirements:
- Length: ~${words} words (±10%).
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
- Do not mention that you are an AI model; avoid generic disclaimers.`;

  const usr = `Main keyword: ${keyword}
Language: ${language}
Goal: Generate an SEO-ready, human-sounding article with the above structure.`;

  // Ollama local streaming (JSON Lines)
  if (provider === 'ollama') {
    const upstream = await fetch(`${base}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        prompt: `${sys}\n\n${usr}`,
        options: { temperature: 0.7 },
        stream: true,
      }),
    });
    if (!upstream.ok || !upstream.body) return new Response('Upstream error', { status: 500 });

    const decoder = new TextDecoder();
    const encoder = new TextEncoder();

    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        const reader = upstream.body!.getReader();
        let buffer = '';
        const pump = (): Promise<void> =>
          reader
            .read()
            .then(({ done, value }) => {
              if (done) {
                controller.close();
                return;
              }
              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split(/\r?\n/);
              buffer = lines.pop() ?? '';
              for (const raw of lines) {
                if (!raw) continue;
                try {
                  const msg = JSON.parse(raw);
                  const text = msg?.response ?? '';
                  if (text) controller.enqueue(encoder.encode(text));
                  // msg.done may appear on final line; we simply close when upstream ends.
                } catch {
                  // ignore partial/non-JSON fragments
                }
              }
              return pump();
            })
            .catch((error) => controller.error(error));
        return pump();
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'X-Accel-Buffering': 'no',
      },
    });
  }

  // OpenAI-compatible streaming (DeepInfra, Together, Groq, OpenAI, custom)
  const upstream = await fetch(`${base}/chat/completions`, {
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
      top_p: 0.95,
      stream: true,
    }),
  });

  if (!upstream.ok || !upstream.body) {
    const err = await upstream.text().catch(() => 'Upstream error');
    return new Response(err, { status: 500 });
  }

  const decoder = new TextDecoder();
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const reader = upstream.body!.getReader();
      let buffer = '';
      const pump = (): Promise<void> =>
        reader
          .read()
          .then(({ done, value }) => {
            if (done) {
              controller.close();
              return;
            }
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split(/\r?\n/);
            buffer = lines.pop() ?? '';
            for (const raw of lines) {
              const line = raw.trim();
              if (!line || !line.startsWith('data:')) continue;
              const data = line.slice(5).trim();
              if (data === '[DONE]') {
                controller.close();
                return;
              }
              try {
                const json = JSON.parse(data);
                const delta = json?.choices?.[0]?.delta?.content ?? '';
                if (delta) controller.enqueue(encoder.encode(delta));
              } catch {
                // ignore non-JSON lines
              }
            }
            return pump();
          })
          .catch((error) => controller.error(error));
      return pump();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache',
      'X-Accel-Buffering': 'no',
    },
  });
}
