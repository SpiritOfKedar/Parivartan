import { Redis } from "ioredis";

export function isRedisConfigured(): boolean {
  return Boolean(process.env.UPSTASH_REDIS_URL?.trim());
}

let redis: Redis | null = null;

export function getRedis(): Redis {
  if (!isRedisConfigured()) {
    throw new Error("UPSTASH_REDIS_URL is not set");
  }

  if (!redis) {
    redis = new Redis(process.env.UPSTASH_REDIS_URL!, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    });
  }

  return redis;
}
