import { mkdtemp, mkdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { getToolOutput, outputFileNameForTool } from "@convert-hub/shared";
import { convertPdfToDocx } from "./converters/pdf-to-word.js";
import { convertPdfToExcel } from "./converters/pdf-to-excel.js";
import { convertPdfToPptx } from "./converters/pdf-to-ppt.js";
import { convertWordToPdf } from "./converters/word-to-pdf.js";
import { getJobRecord, updateJobStatus } from "./db/jobs.js";
import {
  buildOutputKey,
  downloadObjectToFile,
  uploadFile,
} from "./lib/storage.js";

type ConverterFn = (
  inputPath: string,
  outputDir: string,
  workDir: string,
  onStage?: (label: string) => void,
) => Promise<string>;

const converters: Record<string, ConverterFn> = {
  "pdf-to-word": convertPdfToDocx,
  "pdf-to-ppt": convertPdfToPptx,
  "pdf-to-excel": convertPdfToExcel,
  "word-to-pdf": convertWordToPdf,
};

export async function processJob(jobId: string, tool: string): Promise<void> {
  const job = await getJobRecord(jobId);
  if (!job) {
    throw new Error(`Job ${jobId} not found`);
  }

  if (!job.storage_key) {
    throw new Error("Job is missing an uploaded file.");
  }

  const converter = converters[tool];
  if (!converter) {
    throw new Error(`Unsupported server tool: ${tool}`);
  }

  const outputMeta = getToolOutput(tool);
  if (!outputMeta) {
    throw new Error(`No output metadata configured for tool: ${tool}`);
  }

  await updateJobStatus(jobId, "processing", { progress: 5 });

  const workDir = await mkdtemp(join(tmpdir(), "convert-hub-doc-"));
  const inputPath = join(workDir, job.file_name.replace(/[^a-zA-Z0-9._-]/g, "_"));
  const outputDir = join(workDir, "out");

  try {
    await downloadObjectToFile(job.storage_key, inputPath);
    await mkdir(outputDir, { recursive: true });
    await updateJobStatus(jobId, "processing", { progress: 15 });

    const outputPath = await converter(inputPath, outputDir, workDir, (label) => {
      if (label.includes("OCR")) {
        void updateJobStatus(jobId, "processing", { progress: 35 });
      }
    });

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
      error instanceof Error ? error.message : "Conversion failed.";
    await updateJobStatus(jobId, "failed", { error: message });
    throw error;
  } finally {
    await rm(workDir, { recursive: true, force: true });
  }
}
