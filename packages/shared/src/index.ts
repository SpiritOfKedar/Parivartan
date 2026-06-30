export type JobStatus =
  | "queued"
  | "processing"
  | "done"
  | "failed"
  | "client_ready";

export type ProcessingTarget = "client" | "server";

export interface CreateJobRequest {
  tool: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
}

export interface Job {
  id: string;
  tool: string;
  status: JobStatus;
  progress: number;
  processing: ProcessingTarget;
  outputUrl?: string;
  error?: string;
  createdAt: string;
}

export interface ToolDefinition {
  id: string;
  name: string;
  category: "pdf" | "image" | "audio" | "video" | "office";
  clientCapable: boolean;
  requiresServer: boolean;
  clientMaxBytes: number;
}
