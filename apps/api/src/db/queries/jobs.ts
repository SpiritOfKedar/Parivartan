import type { Job, JobStatus, ProcessingTarget } from "@convert-hub/shared";
import { getPool } from "../pool.js";

interface JobRow {
  id: string;
  tool: string;
  status: JobStatus;
  progress: number;
  processing: ProcessingTarget;
  file_name: string;
  mime_type: string;
  size_bytes: string;
  storage_key: string | null;
  output_url: string | null;
  error: string | null;
  created_at: Date;
}

function rowToJob(row: JobRow): Job {
  return {
    id: row.id,
    tool: row.tool,
    status: row.status,
    progress: row.progress,
    processing: row.processing,
    outputUrl: row.output_url ?? undefined,
    error: row.error ?? undefined,
    createdAt: row.created_at.toISOString(),
  };
}

export interface InsertJobInput {
  id: string;
  tool: string;
  status: JobStatus;
  progress: number;
  processing: ProcessingTarget;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  storageKey?: string;
}

export async function insertJob(input: InsertJobInput): Promise<Job> {
  const result = await getPool().query<JobRow>(
    `
      INSERT INTO jobs (
        id, tool, status, progress, processing,
        file_name, mime_type, size_bytes, storage_key
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `,
    [
      input.id,
      input.tool,
      input.status,
      input.progress,
      input.processing,
      input.fileName,
      input.mimeType,
      input.sizeBytes,
      input.storageKey ?? null,
    ],
  );

  return rowToJob(result.rows[0]!);
}

export async function getJobById(id: string): Promise<Job | null> {
  const result = await getPool().query<JobRow>(
    "SELECT * FROM jobs WHERE id = $1",
    [id],
  );

  const row = result.rows[0];
  return row ? rowToJob(row) : null;
}

export async function updateJobStatus(
  id: string,
  status: JobStatus,
  fields?: { progress?: number; outputUrl?: string; error?: string },
): Promise<Job | null> {
  const result = await getPool().query<JobRow>(
    `
      UPDATE jobs
      SET
        status = $2,
        progress = COALESCE($3, progress),
        output_url = COALESCE($4, output_url),
        error = COALESCE($5, error),
        updated_at = now()
      WHERE id = $1
      RETURNING *
    `,
    [
      id,
      status,
      fields?.progress ?? null,
      fields?.outputUrl ?? null,
      fields?.error ?? null,
    ],
  );

  const row = result.rows[0];
  return row ? rowToJob(row) : null;
}
