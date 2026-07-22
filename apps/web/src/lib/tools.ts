import { getTool, tools } from "@convert-hub/conversion-rules";
import type { ToolDefinition } from "@convert-hub/shared";
import { getDictionary } from "./i18n/get-dictionary";
import type { Locale } from "./i18n/config";

export const categoryOrder: ToolDefinition["category"][] = [
  "pdf",
  "image",
  "video",
  "office",
  "audio",
];

/** @deprecated Prefer messages.tools[id].description via i18n */
export function getToolDescription(
  toolId: string,
  locale: Locale = "en",
): string {
  return (
    getDictionary(locale).tools[toolId]?.description ?? "Convert your file."
  );
}

export function getToolsByCategory(): {
  category: ToolDefinition["category"];
  tools: ToolDefinition[];
}[] {
  return categoryOrder
    .map((category) => ({
      category,
      tools: tools.filter((tool) => tool.category === category),
    }))
    .filter((group) => group.tools.length > 0);
}

export function getProcessingNote(
  tool: ToolDefinition,
  locale: Locale = "en",
): string {
  const notes = getDictionary(locale).notes;
  if (tool.id === "pdf-summarize" || tool.id === "pdf-translate") {
    return notes.ai;
  }
  if (tool.requiresServer) {
    return notes.server;
  }
  if (tool.clientCapable) {
    return notes.browser;
  }
  return notes.server;
}

export function getUploadLabel(toolId: string, locale: Locale = "en"): string {
  const c = getDictionary(locale).common;
  const pdfIds = new Set([
    "merge-pdf",
    "compress-pdf",
    "split-pdf",
    "pdf-to-word",
    "pdf-to-ppt",
    "pdf-to-excel",
    "pdf-to-jpg",
    "edit-pdf",
    "watermark-pdf",
    "rotate-pdf",
    "pdf-summarize",
    "pdf-translate",
    "protect-pdf",
    "page-numbers-pdf",
  ]);

  if (toolId === "merge-audio") return c.selectAudio;
  if (toolId === "merge-pdf") return c.selectPdfs;
  if (toolId === "jpg-to-pdf") return c.selectImages;
  if (toolId === "compress-image") return c.selectImage;
  if (toolId === "resize-image") return c.selectImage;
  if (toolId === "crop-image") return c.selectImage;
  if (toolId === "convert-to-jpg") return c.selectImages;
  if (toolId === "convert-from-jpg") return c.selectJpg;
  if (toolId === "photo-editor") return c.selectImageToEdit;
  if (toolId === "upscale-image") return c.selectImage;
  if (toolId === "remove-background") return c.selectImage;
  if (toolId === "watermark-image") return c.selectImage;
  if (toolId === "meme-generator") return c.selectImage;
  if (toolId === "rotate-image") return c.selectImage;
  if (toolId === "html-to-image") return c.pasteHtml;
  if (toolId === "blur-faces") return c.selectImage;
  if (pdfIds.has(toolId)) return c.selectPdf;
  if (toolId === "word-to-pdf") return c.selectWord;
  return c.selectFile;
}

export { getTool, tools };
