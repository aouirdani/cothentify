import { createAnalysisWorker } from './queues/analysisQueue';
import { prisma } from './db';
import { analyzeContent } from './services/detection/ensemble';

async function handleAnalysis({ contentId }: { contentId: string }) {
  const piece = await prisma.contentPiece.findUnique({ where: { id: contentId } });
  if (!piece) return;
  const result = await analyzeContent(piece.body, { detailed_analysis: true, language: piece.language });

  await prisma.aIAnalysis.create({
    data: {
      contentId: piece.id,
      modelCandidates: result.detected_models,
      aiProbability: result.ai_probability,
      confidence: result.confidence_score,
      details: result.analysis_details as any,
    },
  });
}

function main() {
  const { worker } = createAnalysisWorker(handleAnalysis, 6);
  worker.on('completed', (job) => console.log(`[worker] completed job ${job.id}`));
  worker.on('failed', (job, err) => console.error(`[worker] failed job ${job?.id}:`, err?.message));
}

main();
