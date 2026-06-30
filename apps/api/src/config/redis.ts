import { Redis } from "ioredis";

export function isRedisConfigured(): boolean {
  return Boolean(process.env.UPSTASH_REDIS_URL?.trim());
}

let redis: Redis | null = null;

export function getRedis(): Redis {
  if (!isRedisConfigured()) {
    throw new Error(
      "Upstash Redis is not configured. Set UPSTASH_REDIS_URL (rediss://...) in apps/api/.env",
    );
  }

  if (!redis) {
    redis = new Redis(process.env.UPSTASH_REDIS_URL!, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    });
  }

  return redis;
}

export async function closeRedis(): Promise<void> {
  if (redis) {
    await redis.quit();
    redis = null;
  }
}
