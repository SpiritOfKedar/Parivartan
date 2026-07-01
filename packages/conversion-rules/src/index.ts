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
    id: "pdf-to-word",
    name: "PDF to Word",
    category: "office",
    clientCapable: false,
    requiresServer: true,
    clientMaxBytes: 0,
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
