import { env } from '../../../env';

type ProviderResult = {
  ok: boolean;
  provider: 'huggingface';
  ai_probability?: number;
  detected_models?: string[];
  analysis_details?: {
    sentence_scores: Array<{ index: number; score: number }>;
    pattern_matches: string[];
    linguistic_markers: string[];
  };
  error?: string;
};

/**
 * Calls a Hugging Face Inference API or Space endpoint.
 * - If HUGGINGFACE_API_URL is not set or ENABLE_HF_DETECTOR is false, returns a fallback result (ok: false).
 * - Expected responses:
 *   a) { ai_probability: number, detected_models?: string[], analysis_details?: {...} }
 *   b) Array of classifications with {label: 'ai'|'human', score: number}
 *
 * Users can point HUGGINGFACE_API_URL to a Space (free hosting) or Inference endpoint.
 */
export async function runHFAnalysis(content: string, _options: unknown): Promise<ProviderResult> {
  if (!env.ENABLE_HF_DETECTOR || !env.HUGGINGFACE_API_URL) {
    return { ok: false, provider: 'huggingface' };
  }

  try {
    const res = await fetch(env.HUGGINGFACE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(env.HUGGINGFACE_API_TOKEN ? { Authorization: `Bearer ${env.HUGGINGFACE_API_TOKEN}` } : {}),
      },
      body: JSON.stringify({ inputs: content }),
    });

    if (!res.ok) {
      return { ok: false, provider: 'huggingface', error: `HTTP ${res.status}` };
    }
    const data = await res.json();

    // Case (a): direct structured response
    if (typeof data?.ai_probability === 'number') {
      return {
        ok: true,
        provider: 'huggingface',
        ai_probability: clamp0to100(data.ai_probability),
        detected_models: Array.isArray(data.detected_models) ? data.detected_models : [],
        analysis_details: normalizeDetails(data.analysis_details),
      };
    }

    // Case (b): classification array
    // Example HF output: [{label: 'AI', score: 0.82}, {label: 'Human', score: 0.18}]
    if (Array.isArray(data)) {
      const flat = data.flat();
      let aiScore: number | undefined;
      for (const item of flat) {
        const label = String(item?.label || '').toLowerCase();
        if (label.includes('ai') || label.includes('gpt')) {
          aiScore = Number(item?.score);
          break;
        }
      }
      if (typeof aiScore === 'number') {
        return {
          ok: true,
          provider: 'huggingface',
          ai_probability: clamp0to100(Math.round(aiScore * 100)),
          detected_models: [],
          analysis_details: { sentence_scores: [], pattern_matches: [], linguistic_markers: [] },
        };
      }
    }

    // Fallback if unknown shape
    return {
      ok: true,
      provider: 'huggingface',
      ai_probability: 50,
      detected_models: [],
      analysis_details: { sentence_scores: [], pattern_matches: [], linguistic_markers: [] },
    };
  } catch (e: any) {
    return { ok: false, provider: 'huggingface', error: String(e?.message || e) };
  }
}

function clamp0to100(n: number) {
  return Math.max(0, Math.min(100, n));
}

function normalizeDetails(details: any | undefined) {
  if (!details || typeof details !== 'object') {
    return { sentence_scores: [], pattern_matches: [], linguistic_markers: [] };
  }
  return {
    sentence_scores: Array.isArray(details.sentence_scores) ? details.sentence_scores : [],
    pattern_matches: Array.isArray(details.pattern_matches) ? details.pattern_matches : [],
    linguistic_markers: Array.isArray(details.linguistic_markers) ? details.linguistic_markers : [],
  };
}

