import { resolve } from "node:path";
import dotenv from "dotenv";
import { isDatabaseConfigured } from "./config/db.js";
import { isRedisConfigured } from "./config/redis.js";
import { isStorageConfigured } from "./config/storage.js";
import { getRedis } from "./config/redis.js";
import { processJob } from "./process-job.js";

dotenv.config({ path: resolve(process.cwd(), "../../apps/api/.env") });
dotenv.config({ path: resolve(process.cwd(), ".env") });
dotenv.config();

const SERVER_JOBS_QUEUE = "queue:server-jobs";

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
  console.log("document-worker: listening on", SERVER_JOBS_QUEUE);

  while (true) {
    const result = await redis.brpop(SERVER_JOBS_QUEUE, 0);
    if (!result) {
      continue;
    }

    const [, payload] = result;
    let jobId = "";
    let tool = "";

    try {
      const parsed = JSON.parse(payload) as { jobId?: string; tool?: string };
      jobId = parsed.jobId ?? "";
      tool = parsed.tool ?? "";
      if (!jobId || !tool) {
        throw new Error("Invalid queue payload");
      }

      console.log(`document-worker: processing ${tool} job ${jobId}`);
      await processJob(jobId, tool);
      console.log(`document-worker: completed job ${jobId}`);
    } catch (error) {
      console.error(
        `document-worker: failed job ${jobId || "unknown"}:`,
        error,
      );
    }
  }
}

main().catch((error) => {
  console.error("document-worker: fatal error", error);
  process.exit(1);
});
