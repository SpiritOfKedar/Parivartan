export type JobStatus =
  | "queued"
  | "processing"
  | "done"
  | "failed"
  | "client_ready";

export type ProcessingTarget = "client" | "server";

export interface CreateJobRequest {
  id?: string;
  tool: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  storageKey?: string;
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

export interface ToolOutput {
  extension: string;
  mimeType: string;
}

export const TOOL_OUTPUTS: Record<string, ToolOutput> = {
  "pdf-to-word": {
    extension: ".docx",
    mimeType:
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  },
  "pdf-to-ppt": {
    extension: ".pptx",
    mimeType:
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  },
  "pdf-to-excel": {
    extension: ".xlsx",
    mimeType:
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  },
  "word-to-pdf": {
    extension: ".pdf",
    mimeType: "application/pdf",
  },
};

export function getToolOutput(toolId: string): ToolOutput | undefined {
  return TOOL_OUTPUTS[toolId];
}

export function outputFileNameForTool(
  inputName: string,
  toolId: string,
): string {
  const output = getToolOutput(toolId);
  const ext = output?.extension ?? ".bin";
  const dot = inputName.lastIndexOf(".");
  const stem = dot > 0 ? inputName.slice(0, dot) : inputName;
  return `${stem}${ext}`;
}
