import { getRedis, isRedisConfigured } from "../config/redis.js";

const SERVER_JOBS_QUEUE = "queue:server-jobs";

export interface QueuedJobPayload {
  jobId: string;
  tool: string;
}

export async function enqueueServerJob(
  payload: QueuedJobPayload,
): Promise<void> {
  if (!isRedisConfigured()) {
    throw new Error("Upstash Redis is not configured");
  }

  await getRedis().lpush(SERVER_JOBS_QUEUE, JSON.stringify(payload));
}

export async function checkRedisConnection(): Promise<boolean> {
  if (!isRedisConfigured()) {
    return false;
  }

  try {
    const pong = await getRedis().ping();
    return pong === "PONG";
  } catch {
    return false;
  }
}
