import type { ProcessingTarget, ToolDefinition } from "@convert-hub/shared";

export const tools: ToolDefinition[] = [
  {
    id: "merge-pdf",
    name: "Merge PDF",
    category: "pdf",
    clientCapable: true,
    requiresServer: false,
    clientMaxBytes: 10 * 1024 * 1024,
  },
  {
    id: "compress-pdf",
    name: "Compress PDF",
    category: "pdf",
    clientCapable: true,
    requiresServer: false,
    clientMaxBytes: 25 * 1024 * 1024,
  },
  {
    id: "split-pdf",
    name: "Split PDF",
    category: "pdf",
    clientCapable: true,
    requiresServer: false,
    clientMaxBytes: 25 * 1024 * 1024,
  },
  {
    id: "edit-pdf",
    name: "Edit PDF",
    category: "pdf",
    clientCapable: true,
    requiresServer: false,
    clientMaxBytes: 25 * 1024 * 1024,
  },
  {
    id: "watermark-pdf",
    name: "Watermark PDF",
    category: "pdf",
    clientCapable: true,
    requiresServer: false,
    clientMaxBytes: 25 * 1024 * 1024,
  },
  {
    id: "rotate-pdf",
    name: "Rotate PDF",
    category: "pdf",
    clientCapable: true,
    requiresServer: false,
    clientMaxBytes: 25 * 1024 * 1024,
  },
  {
    id: "pdf-summarize",
    name: "PDF AI Summarizer",
    category: "pdf",
    clientCapable: true,
    requiresServer: false,
    clientMaxBytes: 25 * 1024 * 1024,
  },
  {
    id: "pdf-translate",
    name: "Translate PDF",
    category: "pdf",
    clientCapable: true,
    requiresServer: false,
    clientMaxBytes: 25 * 1024 * 1024,
  },
  {
    id: "protect-pdf",
    name: "Protect PDF",
    category: "pdf",
    clientCapable: true,
    requiresServer: false,
    clientMaxBytes: 25 * 1024 * 1024,
  },
  {
    id: "page-numbers-pdf",
    name: "Add Page Numbers",
    category: "pdf",
    clientCapable: true,
    requiresServer: false,
    clientMaxBytes: 25 * 1024 * 1024,
  },
  {
    id: "pdf-to-word",
    name: "PDF to Word",
    category: "office",
    clientCapable: false,
    requiresServer: true,
    clientMaxBytes: 0,
  },
  {
    id: "pdf-to-ppt",
    name: "PDF to PowerPoint",
    category: "office",
    clientCapable: false,
    requiresServer: true,
    clientMaxBytes: 0,
  },
  {
    id: "pdf-to-excel",
    name: "PDF to Excel",
    category: "office",
    clientCapable: false,
    requiresServer: true,
    clientMaxBytes: 0,
  },
  {
    id: "word-to-pdf",
    name: "Word to PDF",
    category: "office",
    clientCapable: false,
    requiresServer: true,
    clientMaxBytes: 0,
  },
  {
    id: "jpg-to-pdf",
    name: "JPG to PDF",
    category: "pdf",
    clientCapable: true,
    requiresServer: false,
    clientMaxBytes: 25 * 1024 * 1024,
  },
  {
    id: "pdf-to-jpg",
    name: "PDF to JPG",
    category: "image",
    clientCapable: true,
    requiresServer: false,
    clientMaxBytes: 25 * 1024 * 1024,
  },
  {
    id: "compress-image",
    name: "Compress Image",
    category: "image",
    clientCapable: true,
    requiresServer: false,
    clientMaxBytes: 15 * 1024 * 1024,
  },
  {
    id: "mp4-to-webm",
    name: "MP4 to WebM",
    category: "video",
    clientCapable: true,
    requiresServer: true,
    clientMaxBytes: 80 * 1024 * 1024,
  },
];

const toolMap = new Map(tools.map((tool) => [tool.id, tool]));

export function getTool(toolId: string): ToolDefinition | undefined {
  return toolMap.get(toolId);
}

export function routeJob(input: {
  toolId: string;
  sizeBytes: number;
}): ProcessingTarget {
  const tool = getTool(input.toolId);
  if (!tool) return "server";

  if (tool.requiresServer) return "server";
  if (input.sizeBytes > tool.clientMaxBytes) return "server";
  if (tool.clientCapable) return "client";

  return "server";
}
