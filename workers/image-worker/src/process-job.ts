import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { getToolOutput, outputFileNameForTool } from "@convert-hub/shared";
import { getJobRecord, updateJobStatus } from "./db/jobs.js";
import { runPythonScript } from "./lib/python.js";
import {
  buildOutputKey,
  downloadObjectToFile,
  uploadFile,
} from "./lib/storage.js";

interface ImageJobOptions {
  scale?: 2 | 4;
  blurStrength?: "light" | "medium" | "strong";
}

type ImageProcessor = (
  inputPath: string,
  outputPath: string,
  options: ImageJobOptions,
) => Promise<void>;

const processors: Record<string, ImageProcessor> = {
  "upscale-image": async (inputPath, outputPath, options) => {
    const scale = options.scale === 4 ? 4 : 2;
    await runPythonScript("upscale.py", [
      inputPath,
      outputPath,
      String(scale),
    ]);
  },
  "remove-background": async (inputPath, outputPath) => {
    await runPythonScript("remove_background.py", [inputPath, outputPath]);
  },
  "blur-faces": async (inputPath, outputPath, options) => {
    const strength = options.blurStrength ?? "medium";
    await runPythonScript("blur_faces.py", [
      inputPath,
      outputPath,
      strength,
    ]);
  },
};

export async function processJob(
  jobId: string,
  tool: string,
  options: ImageJobOptions = {},
): Promise<void> {
  const job = await getJobRecord(jobId);
  if (!job) {
    throw new Error(`Job ${jobId} not found`);
  }

  if (!job.storage_key) {
    throw new Error("Job is missing an uploaded file.");
  }

  const processor = processors[tool];
  if (!processor) {
    throw new Error(`Unsupported image tool: ${tool}`);
  }

  const outputMeta = getToolOutput(tool);
  if (!outputMeta) {
    throw new Error(`No output metadata configured for tool: ${tool}`);
  }

  await updateJobStatus(jobId, "processing", { progress: 5 });

  const workDir = await mkdtemp(join(tmpdir(), "convert-hub-image-"));
  const inputPath = join(
    workDir,
    job.file_name.replace(/[^a-zA-Z0-9._-]/g, "_"),
  );
  const outputPath = join(workDir, `output${outputMeta.extension}`);

  try {
    await downloadObjectToFile(job.storage_key, inputPath);
    await updateJobStatus(jobId, "processing", { progress: 20 });

    await processor(inputPath, outputPath, options);
    await updateJobStatus(jobId, "processing", { progress: 80 });

    const outputName = outputFileNameForTool(job.file_name, tool);
    const outputKey = buildOutputKey(jobId, outputName);
    await uploadFile(outputKey, outputPath, outputMeta.mimeType);

    await updateJobStatus(jobId, "done", {
      progress: 100,
      outputUrl: outputKey,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Image processing failed.";
    await updateJobStatus(jobId, "failed", { error: message });
    throw error;
  } finally {
    await rm(workDir, { recursive: true, force: true });
  }
}
