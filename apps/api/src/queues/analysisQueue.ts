import { Queue, Worker, QueueEvents, JobsOptions } from 'bullmq';
import Redis from 'ioredis';
import { env } from '../env';

const baseConnection = new Redis(env.REDIS_URL ?? 'redis://localhost:6379');

function createConnection() {
  return baseConnection.duplicate();
}

export type AnalysisJobData = { contentId: string };

export const ANALYSIS_QUEUE = 'analysis-queue';

let queue: Queue<AnalysisJobData> | undefined;
export function getAnalysisQueue() {
  if (!queue) {
    queue = new Queue<AnalysisJobData>(ANALYSIS_QUEUE, {
      connection: createConnection(),
      defaultJobOptions: { removeOnComplete: true, removeOnFail: 100 },
    });
  }
  return queue;
}

export function createAnalysisWorker(handler: (data: AnalysisJobData) => Promise<void>, concurrency = 4) {
  const worker = new Worker<AnalysisJobData>(
    ANALYSIS_QUEUE,
    async (job) => handler(job.data),
    { connection: createConnection(), concurrency },
  );
  const events = new QueueEvents(ANALYSIS_QUEUE, { connection: createConnection() });
  return { worker, events };
}

export async function enqueue(data: AnalysisJobData, opts?: JobsOptions) {
  return getAnalysisQueue().add('analyze', data, opts);
}
