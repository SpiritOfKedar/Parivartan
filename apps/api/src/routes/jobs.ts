import { Router } from "express";
import { z } from "zod";
import { routeJob } from "@convert-hub/conversion-rules";
import type { CreateJobRequest, Job } from "@convert-hub/shared";

export const jobsRouter = Router();

const createJobSchema = z.object({
  tool: z.string().min(1),
  fileName: z.string().min(1),
  mimeType: z.string().min(1),
  sizeBytes: z.number().int().positive(),
});

jobsRouter.post("/", (req, res) => {
  const parsed = createJobSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const body = parsed.data as CreateJobRequest;
  const processing = routeJob({
    sizeBytes: body.sizeBytes,
    toolId: body.tool,
  });

  const job: Job = {
    id: crypto.randomUUID(),
    tool: body.tool,
    status: processing === "client" ? "client_ready" : "queued",
    progress: 0,
    processing,
    createdAt: new Date().toISOString(),
  };

  // TODO: enqueue server jobs to BullMQ when worker layer is added
  res.status(201).json({ job });
});

jobsRouter.get("/:id", (req, res) => {
  res.status(404).json({
    error: "Job not found",
    id: req.params.id,
  });
});
