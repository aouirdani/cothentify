import { runOpenAIAnalysis } from './providers/openai';
import { runAnthropicAnalysis } from './providers/anthropic';
import { runHFAnalysis } from './providers/huggingface';
import { env } from '../../env';

export type AnalysisOptions = {
  detailed_analysis?: boolean;
  batch_processing?: boolean;
  language?: string;
};

export type AnalysisResult = {
  ai_probability: number; // 0-100
  confidence_score: number; // 0-100
  detected_models: string[];
  analysis_details: {
    sentence_scores: Array<{ index: number; score: number }>;
    pattern_matches: string[];
    linguistic_markers: string[];
  };
};

export async function analyzeContent(content: string, options: AnalysisOptions): Promise<AnalysisResult> {
  // Run providers in parallel; each gracefully degrades if API keys are missing.
  const [openai, anthropic, hf] = await Promise.all([
    runOpenAIAnalysis(content, options).catch((e) => ({ provider: 'openai', ok: false, error: String(e) })),
    runAnthropicAnalysis(content, options).catch((e) => ({ provider: 'anthropic', ok: false, error: String(e) })),
    (env.ENABLE_HF_DETECTOR ? runHFAnalysis(content, options) : Promise.resolve({ ok: false, provider: 'huggingface' }))
      .catch((e) => ({ provider: 'huggingface', ok: false, error: String(e) })),
  ]);

  const scores: number[] = [];
  const models = new Set<string>();
  const sentence_scores: Array<{ index: number; score: number }> = [];
  const pattern_matches: string[] = [];
  const linguistic_markers: string[] = [];

  const providers = [openai as any, anthropic as any, hf as any];
  for (const p of providers) {
    if (p?.ok && typeof p.ai_probability === 'number') {
      scores.push(p.ai_probability);
      p.detected_models?.forEach((m: string) => models.add(m));
      sentence_scores.push(...(p.analysis_details?.sentence_scores ?? []));
      pattern_matches.push(...(p.analysis_details?.pattern_matches ?? []));
      linguistic_markers.push(...(p.analysis_details?.linguistic_markers ?? []));
    }
  }

  // Fallback heuristic if no providers active (e.g., no API keys in dev)
  if (scores.length === 0) {
    const basicScore = Math.min(100, Math.max(0, Math.round(Math.log10(Math.max(content.length, 10)) * 10)));
    scores.push(basicScore);
  }

  const ai_probability = Number((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1));
  const confidence_score = Number((Math.min(100, 60 + scores.length * 20)).toFixed(1));

  return {
    ai_probability,
    confidence_score,
    detected_models: Array.from(models),
    analysis_details: {
      sentence_scores: sentence_scores.slice(0, 20),
      pattern_matches: pattern_matches.slice(0, 20),
      linguistic_markers: linguistic_markers.slice(0, 20),
    },
  };
}
