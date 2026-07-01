import { mkdtemp, mkdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { convertPdfToDocx } from "./converters/pdf-to-word.js";
import { getJobRecord, updateJobStatus } from "./db/jobs.js";
import {
  buildOutputKey,
  downloadObjectToFile,
  uploadFile,
} from "./lib/storage.js";

function outputFileName(inputName: string): string {
  const dot = inputName.lastIndexOf(".");
  const stem = dot > 0 ? inputName.slice(0, dot) : inputName;
  return `${stem}.docx`;
}

export async function processJob(jobId: string, tool: string): Promise<void> {
  const job = await getJobRecord(jobId);
  if (!job) {
    throw new Error(`Job ${jobId} not found`);
  }

  if (!job.storage_key) {
    throw new Error("Job is missing an uploaded file.");
  }

  await updateJobStatus(jobId, "processing", { progress: 5 });

  const workDir = await mkdtemp(join(tmpdir(), "convert-hub-doc-"));
  const inputPath = join(workDir, job.file_name.replace(/[^a-zA-Z0-9._-]/g, "_"));
  const outputDir = join(workDir, "out");

  try {
    await downloadObjectToFile(job.storage_key, inputPath);
    await mkdir(outputDir, { recursive: true });
    await updateJobStatus(jobId, "processing", { progress: 15 });

    let outputPath: string;
    switch (tool) {
      case "pdf-to-word":
        outputPath = await convertPdfToDocx(inputPath, outputDir, workDir, (label) => {
          if (label.includes("OCR")) {
            void updateJobStatus(jobId, "processing", { progress: 35 });
          }
        });
        break;
      default:
        throw new Error(`Unsupported server tool: ${tool}`);
    }

    await updateJobStatus(jobId, "processing", { progress: 80 });

    const outputName = outputFileName(job.file_name);
    const outputKey = buildOutputKey(jobId, outputName);
    await uploadFile(
      outputKey,
      outputPath,
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    );

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
