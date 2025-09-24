import Redis from 'ioredis';
import { env } from './env';

export const redis = new Redis(env.REDIS_URL ?? 'redis://localhost:6379');

export async function cacheGet<T>(key: string): Promise<T | null> {
  const val = await redis.get(key);
  return val ? (JSON.parse(val) as T) : null;
}

export async function cacheSet(key: string, value: unknown, ttlSeconds: number) {
  await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
}
