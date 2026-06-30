import { Router } from "express";
import { z } from "zod";
import { routeJob } from "@convert-hub/conversion-rules";
import type { CreateJobRequest } from "@convert-hub/shared";
import { isDatabaseConfigured } from "../config/db.js";
import { isRedisConfigured } from "../config/redis.js";
import { getJobById, insertJob } from "../db/queries/jobs.js";
import { enqueueServerJob } from "../lib/queue.js";

export const jobsRouter = Router();

const createJobSchema = z.object({
  tool: z.string().min(1),
  fileName: z.string().min(1),
  mimeType: z.string().min(1),
  sizeBytes: z.number().int().positive(),
  storageKey: z.string().min(1).optional(),
});

jobsRouter.post("/", async (req, res, next) => {
  try {
    if (!isDatabaseConfigured()) {
      res.status(503).json({
        error: "Database not configured. Set DATABASE_URL in apps/api/.env",
      });
      return;
    }

    const parsed = createJobSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }

    const body = parsed.data as CreateJobRequest & { storageKey?: string };
    const processing = routeJob({
      sizeBytes: body.sizeBytes,
      toolId: body.tool,
    });

    const status = processing === "client" ? "client_ready" : "queued";
    const id = crypto.randomUUID();

    const job = await insertJob({
      id,
      tool: body.tool,
      status,
      progress: 0,
      processing,
      fileName: body.fileName,
      mimeType: body.mimeType,
      sizeBytes: body.sizeBytes,
      storageKey: body.storageKey,
    });

    if (processing === "server") {
      if (!isRedisConfigured()) {
        res.status(503).json({
          error:
            "Redis not configured. Set UPSTASH_REDIS_URL in apps/api/.env",
        });
        return;
      }

      await enqueueServerJob({ jobId: job.id, tool: job.tool });
    }

    res.status(201).json({ job });
  } catch (error) {
    next(error);
  }
});

jobsRouter.get("/:id", async (req, res, next) => {
  try {
    if (!isDatabaseConfigured()) {
      res.status(503).json({
        error: "Database not configured. Set DATABASE_URL in apps/api/.env",
      });
      return;
    }

    const job = await getJobById(req.params.id);
    if (!job) {
      res.status(404).json({
        error: "Job not found",
        id: req.params.id,
      });
      return;
    }

    res.json({ job });
  } catch (error) {
    next(error);
  }
});
