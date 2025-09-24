import { enqueue } from '../queues/analysisQueue';

export async function enqueueAnalysisJob(contentId: string) {
  return enqueue({ contentId }, { attempts: 3, backoff: { type: 'exponential', delay: 1000 } });
}

