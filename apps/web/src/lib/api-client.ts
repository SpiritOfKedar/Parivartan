import type { Job } from "@convert-hub/shared";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8788";

interface DirectUploadResponse {
  jobId: string;
  key: string;
  sizeBytes: number;
  fileName: string;
  mimeType: string;
}

interface JobResponse {
  job: Job;
}

interface ApiError {
  error: string;
}

async function parseJson<T>(response: Response): Promise<T> {
  const data = (await response.json()) as T & ApiError;
  if (!response.ok) {
    throw new Error(data.error ?? `Request failed (${response.status})`);
  }
  return data;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function uploadFileAndCreateJob(
  file: File,
  tool: string,
  options?: Record<string, unknown>,
): Promise<Job> {
  const formData = new FormData();
  formData.append("file", file);

  let uploaded: DirectUploadResponse;
  try {
    uploaded = await parseJson<DirectUploadResponse>(
      await fetch(`${API_URL}/api/uploads/direct`, {
        method: "POST",
        body: formData,
      }),
    );
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error(
        "Could not reach the API server. Make sure `npm run dev` is running.",
      );
    }
    throw error;
  }

  const created = await parseJson<JobResponse>(
    await fetch(`${API_URL}/api/jobs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: uploaded.jobId,
        tool,
        fileName: uploaded.fileName || file.name,
        mimeType: uploaded.mimeType || file.type || "application/pdf",
        sizeBytes: uploaded.sizeBytes || file.size,
        storageKey: uploaded.key,
        options,
      }),
    }),
  );

  return created.job;
}

export async function getJob(jobId: string): Promise<Job> {
  const response = await parseJson<JobResponse>(
    await fetch(`${API_URL}/api/jobs/${jobId}`, { cache: "no-store" }),
  );
  return response.job;
}

export async function waitForJob(
  jobId: string,
  onUpdate?: (job: Job) => void,
): Promise<Job> {
  while (true) {
    const job = await getJob(jobId);
    onUpdate?.(job);

    if (job.status === "done") {
      return job;
    }

    if (job.status === "failed") {
      throw new Error(job.error ?? "Conversion failed on the server.");
    }

    await sleep(1500);
  }
}

export function getApiUrl(): string {
  return API_URL;
}

export async function downloadJobResult(jobId: string): Promise<Blob> {
  const response = await fetch(`${API_URL}/api/jobs/${jobId}/download`);
  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(data?.error ?? "Download failed.");
  }
  return response.blob();
}

export type AiProvider = "gemini" | "nvidia-nim";

interface AiProvidersResponse {
  providers: AiProvider[];
}

interface AiResultResponse {
  result: {
    text: string;
    provider: AiProvider;
    model: string;
  };
}

async function postAi<T>(path: string, body: unknown): Promise<T> {
  try {
    return await parseJson<T>(
      await fetch(`${API_URL}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }),
    );
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error(
        "Could not reach the API server. Make sure `npm run dev` is running.",
      );
    }
    throw error;
  }
}

export async function getAiProviders(): Promise<AiProvider[]> {
  const data = await parseJson<AiProvidersResponse>(
    await fetch(`${API_URL}/api/ai/providers`, { cache: "no-store" }),
  );
  return data.providers;
}

export async function summarizePdfText(
  text: string,
  provider: AiProvider,
): Promise<AiResultResponse["result"]> {
  const data = await postAi<AiResultResponse>("/api/ai/summarize", {
    text,
    provider,
  });
  return data.result;
}

export async function translatePdfText(
  text: string,
  targetLanguage: string,
  provider: AiProvider,
): Promise<AiResultResponse["result"]> {
  const data = await postAi<AiResultResponse>("/api/ai/translate", {
    text,
    targetLanguage,
    provider,
  });
  return data.result;
}

