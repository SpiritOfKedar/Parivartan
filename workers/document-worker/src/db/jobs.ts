import type { JobStatus } from "@convert-hub/shared";
import { getPool } from "./pool.js";

interface JobRow {
  id: string;
  tool: string;
  status: JobStatus;
  progress: number;
  file_name: string;
  mime_type: string;
  storage_key: string | null;
}

export async function getJobRecord(id: string): Promise<JobRow | null> {
  const result = await getPool().query<JobRow>(
  `SELECT id, tool, status, progress, file_name, mime_type, storage_key
   FROM jobs WHERE id = $1`,
    [id],
  );
  return result.rows[0] ?? null;
}

export async function updateJobStatus(
  id: string,
  status: JobStatus,
  fields?: { progress?: number; outputUrl?: string; error?: string },
): Promise<void> {
  await getPool().query(
    `
      UPDATE jobs
      SET
        status = $2,
        progress = COALESCE($3, progress),
        output_url = COALESCE($4, output_url),
        error = COALESCE($5, error),
        updated_at = now()
      WHERE id = $1
    `,
    [
      id,
      status,
      fields?.progress ?? null,
      fields?.outputUrl ?? null,
      fields?.error ?? null,
    ],
  );
}
