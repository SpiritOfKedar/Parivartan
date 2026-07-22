import type { ProcessingTarget, ToolDefinition } from "@convert-hub/shared";

/** No practical client-side size cap — tools accept any file the browser can load. */
const UNLIMITED = Number.MAX_SAFE_INTEGER;

export const tools: ToolDefinition[] = [
  {
    id: "merge-pdf",
    name: "Merge PDF",
    category: "pdf",
    clientCapable: true,
    requiresServer: false,
    clientMaxBytes: UNLIMITED,
  },
  {
    id: "compress-pdf",
    name: "Compress PDF",
    category: "pdf",
    clientCapable: true,
    requiresServer: false,
    clientMaxBytes: UNLIMITED,
  },
  {
    id: "split-pdf",
    name: "Split PDF",
    category: "pdf",
    clientCapable: true,
    requiresServer: false,
    clientMaxBytes: UNLIMITED,
  },
  {
    id: "edit-pdf",
    name: "Edit PDF",
    category: "pdf",
    clientCapable: true,
    requiresServer: false,
    clientMaxBytes: UNLIMITED,
  },
  {
    id: "watermark-pdf",
    name: "Watermark PDF",
    category: "pdf",
    clientCapable: true,
    requiresServer: false,
    clientMaxBytes: UNLIMITED,
  },
  {
    id: "rotate-pdf",
    name: "Rotate PDF",
    category: "pdf",
    clientCapable: true,
    requiresServer: false,
    clientMaxBytes: UNLIMITED,
  },
  {
    id: "pdf-summarize",
    name: "PDF AI Summarizer",
    category: "pdf",
    clientCapable: true,
    requiresServer: false,
    clientMaxBytes: UNLIMITED,
  },
  {
    id: "pdf-translate",
    name: "Translate PDF",
    category: "pdf",
    clientCapable: true,
    requiresServer: false,
    clientMaxBytes: UNLIMITED,
  },
  {
    id: "protect-pdf",
    name: "Protect PDF",
    category: "pdf",
    clientCapable: true,
    requiresServer: false,
    clientMaxBytes: UNLIMITED,
  },
  {
    id: "page-numbers-pdf",
    name: "Add Page Numbers",
    category: "pdf",
    clientCapable: true,
    requiresServer: false,
    clientMaxBytes: UNLIMITED,
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
    clientMaxBytes: UNLIMITED,
  },
  {
    id: "pdf-to-jpg",
    name: "PDF to JPG",
    category: "image",
    clientCapable: true,
    requiresServer: false,
    clientMaxBytes: UNLIMITED,
  },
  {
    id: "compress-image",
    name: "Compress Image",
    category: "image",
    clientCapable: true,
    requiresServer: false,
    clientMaxBytes: UNLIMITED,
  },
  {
    id: "resize-image",
    name: "Resize Image",
    category: "image",
    clientCapable: true,
    requiresServer: false,
    clientMaxBytes: UNLIMITED,
  },
  {
    id: "crop-image",
    name: "Crop Image",
    category: "image",
    clientCapable: true,
    requiresServer: false,
    clientMaxBytes: UNLIMITED,
  },
  {
    id: "convert-to-jpg",
    name: "Convert to JPG",
    category: "image",
    clientCapable: true,
    requiresServer: false,
    clientMaxBytes: UNLIMITED,
  },
  {
    id: "convert-from-jpg",
    name: "Convert from JPG",
    category: "image",
    clientCapable: true,
    requiresServer: false,
    clientMaxBytes: UNLIMITED,
  },
  {
    id: "photo-editor",
    name: "Photo Editor",
    category: "image",
    clientCapable: true,
    requiresServer: false,
    clientMaxBytes: UNLIMITED,
  },
  {
    id: "upscale-image",
    name: "Upscale Image",
    category: "image",
    clientCapable: true,
    requiresServer: false,
    clientMaxBytes: UNLIMITED,
  },
  {
    id: "remove-background",
    name: "Remove Background",
    category: "image",
    clientCapable: true,
    requiresServer: false,
    clientMaxBytes: UNLIMITED,
  },
  {
    id: "watermark-image",
    name: "Watermark Image",
    category: "image",
    clientCapable: true,
    requiresServer: false,
    clientMaxBytes: UNLIMITED,
  },
  {
    id: "meme-generator",
    name: "Meme Generator",
    category: "image",
    clientCapable: true,
    requiresServer: false,
    clientMaxBytes: UNLIMITED,
  },
  {
    id: "rotate-image",
    name: "Rotate Image",
    category: "image",
    clientCapable: true,
    requiresServer: false,
    clientMaxBytes: UNLIMITED,
  },
  {
    id: "html-to-image",
    name: "HTML to Image",
    category: "image",
    clientCapable: true,
    requiresServer: false,
    clientMaxBytes: UNLIMITED,
  },
  {
    id: "blur-faces",
    name: "Blur Faces",
    category: "image",
    clientCapable: true,
    requiresServer: false,
    clientMaxBytes: UNLIMITED,
  },
  {
    id: "mp4-to-webm",
    name: "MP4 to WebM",
    category: "video",
    clientCapable: true,
    requiresServer: true,
    clientMaxBytes: 80 * 1024 * 1024,
  },
  {
    id: "merge-audio",
    name: "Merge Audio",
    category: "audio",
    clientCapable: true,
    requiresServer: false,
    clientMaxBytes: 50 * 1024 * 1024,
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
