import { Router } from "express";
import multer from "multer";
import { z } from "zod";
import { getStorageConfig, isStorageConfigured } from "../config/storage.js";
import { buildObjectKey, createUploadUrl, uploadObject } from "../lib/storage.js";

export const uploadsRouter = Router();

const MAX_UPLOAD_BYTES = 500 * 1024 * 1024;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_UPLOAD_BYTES },
});

const presignSchema = z.object({
  fileName: z.string().min(1).max(255),
  mimeType: z.string().min(1).max(127),
  sizeBytes: z
    .number()
    .int()
    .positive()
    .max(500 * 1024 * 1024), // 500 MB per file cap for now
});

uploadsRouter.post("/direct", upload.single("file"), async (req, res, next) => {
  try {
    if (!isStorageConfigured()) {
      res.status(503).json({
        error: "Storage not configured. Set B2_* env vars in apps/api/.env",
      });
      return;
    }

    const file = req.file;
    if (!file) {
      res.status(400).json({ error: "No file uploaded." });
      return;
    }

    const jobId = crypto.randomUUID();
    const config = getStorageConfig();
    const key = buildObjectKey(config.uploadPrefix, jobId, file.originalname);

    await uploadObject({
      key,
      body: file.buffer,
      mimeType: file.mimetype || "application/octet-stream",
    });

    res.status(201).json({
      jobId,
      key,
      sizeBytes: file.size,
      fileName: file.originalname,
      mimeType: file.mimetype,
    });
  } catch (error) {
    next(error);
  }
});

uploadsRouter.post("/presign", async (req, res, next) => {
  try {
    if (!isStorageConfigured()) {
      res.status(503).json({
        error: "Storage not configured. Set B2_* env vars in apps/api/.env",
      });
      return;
    }

    const parsed = presignSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }

    const jobId = crypto.randomUUID();
    const { key, uploadUrl, expiresIn } = await createUploadUrl({
      jobId,
      fileName: parsed.data.fileName,
      mimeType: parsed.data.mimeType,
    });

    res.status(201).json({
      jobId,
      key,
      uploadUrl,
      expiresIn,
      method: "PUT",
      headers: {
        "Content-Type": parsed.data.mimeType,
      },
    });
  } catch (error) {
    next(error);
  }
});
