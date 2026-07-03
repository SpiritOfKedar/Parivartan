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
  "edit-pdf":
    "Add text overlays to your PDF pages. Runs locally in your browser.",
  "watermark-pdf":
    "Stamp a diagonal text watermark on every page of your PDF.",
  "rotate-pdf":
    "Rotate all pages in a PDF by 90°, 180°, or 270°.",
  "pdf-summarize":
    "Extract text from a PDF and generate an AI summary using Gemini or NVIDIA NIM.",
  "pdf-translate":
    "Extract text from a PDF and translate it with AI. Choose Gemini or NVIDIA NIM.",
  "protect-pdf":
    "Password-protect a PDF. Encryption happens locally in your browser.",
  "page-numbers-pdf":
    "Add page numbers to the footer of every page in your PDF.",
  "pdf-to-word":
    "Convert a PDF to an editable Word document on our servers. Text-focused output; scanned pages are OCR'd when needed.",
  "pdf-to-ppt":
    "Convert a PDF to PowerPoint on our servers. Each page becomes a visual slide.",
  "pdf-to-excel":
    "Extract structured text from a PDF into Excel. Best for documents with selectable text or tables.",
  "word-to-pdf":
    "Convert a Word document to PDF on our servers.",
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
  if (tool.id === "pdf-summarize" || tool.id === "pdf-translate") {
    return "Text is extracted in your browser, then sent to our API for AI processing.";
  }
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
