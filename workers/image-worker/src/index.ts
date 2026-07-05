import { resolve } from "node:path";
import dotenv from "dotenv";
import { isDatabaseConfigured } from "./config/db.js";
import { getRedis, isRedisConfigured } from "./config/redis.js";
import { isStorageConfigured } from "./config/storage.js";
import { processJob } from "./process-job.js";

dotenv.config({ path: resolve(process.cwd(), "../../apps/api/.env") });
dotenv.config({ path: resolve(process.cwd(), ".env") });
dotenv.config();

const IMAGE_JOBS_QUEUE = "queue:image-jobs";

interface ImageJobOptions {
  scale?: 2 | 4;
  blurStrength?: "light" | "medium" | "strong";
}

interface QueuePayload {
  jobId?: string;
  tool?: string;
  options?: ImageJobOptions;
}

async function main() {
  if (!isDatabaseConfigured()) {
    throw new Error("DATABASE_URL is not configured");
  }
  if (!isRedisConfigured()) {
    throw new Error("UPSTASH_REDIS_URL is not configured");
  }
  if (!isStorageConfigured()) {
    throw new Error("B2 storage is not configured");
  }

  const redis = getRedis();
  console.log("image-worker: listening on", IMAGE_JOBS_QUEUE);

  while (true) {
    const result = await redis.brpop(IMAGE_JOBS_QUEUE, 0);
    if (!result) {
      continue;
    }

    const [, payload] = result;
    let jobId = "";
    let tool = "";

    try {
      const parsed = JSON.parse(payload) as QueuePayload;
      jobId = parsed.jobId ?? "";
      tool = parsed.tool ?? "";
      if (!jobId || !tool) {
        throw new Error("Invalid queue payload");
      }

      console.log(`image-worker: processing ${tool} job ${jobId}`);
      await processJob(jobId, tool, parsed.options ?? {});
      console.log(`image-worker: completed job ${jobId}`);
    } catch (error) {
      console.error(
        `image-worker: failed job ${jobId || "unknown"}:`,
        error,
      );
    }
  }
}

main().catch((error) => {
  console.error("image-worker: fatal error", error);
  process.exit(1);
});
