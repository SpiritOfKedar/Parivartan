import { getTool, tools } from "@convert-hub/conversion-rules";
import type { ToolDefinition } from "@convert-hub/shared";

export const categoryLabels: Record<ToolDefinition["category"], string> = {
  pdf: "PDF",
  image: "Images",
  audio: "Audio",
  video: "Video",
  office: "Office",
};

export const categoryOrder: ToolDefinition["category"][] = [
  "pdf",
  "image",
  "video",
  "office",
  "audio",
];

const descriptions: Record<string, string> = {
  "merge-pdf": "Combine multiple PDF files into a single document.",
  "compress-pdf":
    "Shrink a PDF to a target size. Lossless mode keeps text sharp; balanced mode only re-encodes when needed.",
  "split-pdf":
    "Separate one page or a whole set into independent PDF files.",
  "pdf-to-word":
    "Convert a PDF to Word on our servers. Scanned PDFs are OCR'd automatically when possible.",
  "pdf-to-ppt":
    "Convert a PDF to PowerPoint on our servers. Each page becomes a slide.",
  "pdf-to-excel":
    "Extract tables and structured text from a PDF into Excel. Best for documents with selectable text or tables.",
  "word-to-pdf":
    "Convert a Word document to PDF on our servers with LibreOffice.",
  "jpg-to-pdf":
    "Combine multiple images into one PDF. Reorder pages before creating the file.",
  "pdf-to-jpg":
    "Export each PDF page as a JPEG image. Multi-page PDFs download as a ZIP archive.",
  "compress-image": "Reduce image file size while keeping acceptable quality.",
  "mp4-to-webm": "Convert MP4 video to WebM format.",
};

export function getToolDescription(toolId: string): string {
  return descriptions[toolId] ?? "Convert your file.";
}

export function getToolsByCategory(): {
  category: ToolDefinition["category"];
  label: string;
  tools: ToolDefinition[];
}[] {
  return categoryOrder
    .map((category) => ({
      category,
      label: categoryLabels[category],
      tools: tools.filter((tool) => tool.category === category),
    }))
    .filter((group) => group.tools.length > 0);
}

export function getProcessingNote(tool: ToolDefinition): string {
  if (tool.requiresServer) {
    return "Processed on our servers.";
  }
  if (tool.clientCapable) {
    const mb = Math.round(tool.clientMaxBytes / (1024 * 1024));
    return `Runs in your browser for files up to ${mb} MB.`;
  }
  return "Processed on our servers.";
}

export { getTool, tools };
