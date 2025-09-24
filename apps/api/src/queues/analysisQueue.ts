import { Queue, Worker, QueueEvents, JobsOptions, ConnectionOptions } from 'bullmq';
import IORedis from 'ioredis';
import { env } from '../env';

const connection: ConnectionOptions = {
  connection: new IORedis(env.REDIS_URL),
  defaultJobOptions: { removeOnComplete: true, removeOnFail: 100 },
} as any;

export type AnalysisJobData = { contentId: string };

export const ANALYSIS_QUEUE = 'analysis-queue';

let queue: Queue<AnalysisJobData> | undefined;
export function getAnalysisQueue() {
  if (!queue) queue = new Queue<AnalysisJobData>(ANALYSIS_QUEUE, connection);
  return queue;
}

export function createAnalysisWorker(handler: (data: AnalysisJobData) => Promise<void>, concurrency = 4) {
  const worker = new Worker<AnalysisJobData>(ANALYSIS_QUEUE, async (job) => handler(job.data), { ...(connection as any), concurrency });
  const events = new QueueEvents(ANALYSIS_QUEUE, connection);
  return { worker, events };
}

export async function enqueue(data: AnalysisJobData, opts?: JobsOptions) {
  return getAnalysisQueue().add('analyze', data, opts);
}
