import { Queue, Worker, QueueEvents, JobsOptions } from 'bullmq';
import Redis from 'ioredis';
import { env } from '../env';

const redis = new Redis(env.REDIS_URL ?? 'redis://localhost:6379');
const conn = { host: redis.options.host as string, port: redis.options.port as number } as const;

export type AnalysisJobData = { contentId: string };

export const ANALYSIS_QUEUE = 'analysis-queue';

let queue: Queue<AnalysisJobData> | undefined;
export function getAnalysisQueue() {
  if (!queue)
    queue = new Queue<AnalysisJobData>(ANALYSIS_QUEUE, {
      connection: conn as any,
      defaultJobOptions: { removeOnComplete: true, removeOnFail: 100 },
    } as any);
  return queue;
}

export function createAnalysisWorker(handler: (data: AnalysisJobData) => Promise<void>, concurrency = 4) {
  const worker = new Worker<AnalysisJobData>(
    ANALYSIS_QUEUE,
    async (job) => handler(job.data),
    { connection: conn as any, concurrency } as any,
  );
  const events = new QueueEvents(ANALYSIS_QUEUE, { connection: conn as any } as any);
  return { worker, events };
}

export async function enqueue(data: AnalysisJobData, opts?: JobsOptions) {
  return getAnalysisQueue().add('analyze', data, opts);
}
