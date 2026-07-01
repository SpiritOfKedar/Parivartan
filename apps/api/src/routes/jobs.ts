import { Router } from "express";
import { z } from "zod";
import { routeJob } from "@convert-hub/conversion-rules";
import { isDatabaseConfigured } from "../config/db.js";
import { isRedisConfigured } from "../config/redis.js";
import { isStorageConfigured } from "../config/storage.js";
import { getJobById, getJobRowById, insertJob } from "../db/queries/jobs.js";
import { enqueueServerJob } from "../lib/queue.js";
import { getObjectBytes } from "../lib/storage.js";

export const jobsRouter = Router();

const createJobSchema = z.object({
  id: z.string().uuid().optional(),
  tool: z.string().min(1),
  fileName: z.string().min(1),
  mimeType: z.string().min(1),
  sizeBytes: z.number().int().positive(),
  storageKey: z.string().min(1),
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

    const body = parsed.data;
    const processing = routeJob({
      sizeBytes: body.sizeBytes,
      toolId: body.tool,
    });

    const status = processing === "client" ? "client_ready" : "queued";
    const id = body.id ?? crypto.randomUUID();

    if (processing === "server" && !body.storageKey) {
      res.status(400).json({ error: "storageKey is required for server jobs." });
      return;
    }

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

function outputFileName(inputName: string): string {
  const dot = inputName.lastIndexOf(".");
  const stem = dot > 0 ? inputName.slice(0, dot) : inputName;
  return `${stem}.docx`;
}

jobsRouter.get("/:id/download", async (req, res, next) => {
  try {
    if (!isDatabaseConfigured()) {
      res.status(503).json({
        error: "Database not configured. Set DATABASE_URL in apps/api/.env",
      });
      return;
    }

    if (!isStorageConfigured()) {
      res.status(503).json({ error: "Storage not configured." });
      return;
    }

    const job = await getJobRowById(req.params.id);
    if (!job || job.status !== "done" || !job.output_url) {
      res.status(404).json({ error: "Converted file not found." });
      return;
    }

    const bytes = await getObjectBytes(job.output_url);
    const fileName = outputFileName(job.file_name);

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${fileName.replace(/"/g, "")}"`,
    );
    res.send(Buffer.from(bytes));
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
