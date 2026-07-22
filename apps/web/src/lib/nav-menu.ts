import type { CategoryId } from "./category-theme";

/** Mega-menu columns for each navbar category (iLovePDF-style). */
export interface NavMenuColumn {
  id: string;
  titleKey: NavMenuTitleKey;
  toolIds: string[];
}

export type NavMenuTitleKey =
  | "organizePdf"
  | "convertPdf"
  | "editImage"
  | "enhanceImage"
  | "convertImage"
  | "toPdf"
  | "fromPdf"
  | "videoTools"
  | "audioTools";

export const navMenuByCategory: Record<CategoryId, NavMenuColumn[]> = {
  pdf: [
    {
      id: "organize",
      titleKey: "organizePdf",
      toolIds: [
        "merge-pdf",
        "split-pdf",
        "compress-pdf",
        "edit-pdf",
        "watermark-pdf",
        "rotate-pdf",
        "page-numbers-pdf",
        "protect-pdf",
      ],
    },
    {
      id: "convert",
      titleKey: "convertPdf",
      toolIds: ["jpg-to-pdf", "pdf-summarize", "pdf-translate"],
    },
  ],
  image: [
    {
      id: "edit",
      titleKey: "editImage",
      toolIds: [
        "photo-editor",
        "crop-image",
        "resize-image",
        "rotate-image",
        "compress-image",
      ],
    },
    {
      id: "enhance",
      titleKey: "enhanceImage",
      toolIds: [
        "watermark-image",
        "upscale-image",
        "remove-background",
        "blur-faces",
        "meme-generator",
      ],
    },
    {
      id: "convert",
      titleKey: "convertImage",
      toolIds: [
        "convert-to-jpg",
        "convert-from-jpg",
        "pdf-to-jpg",
        "html-to-image",
      ],
    },
  ],
  office: [
    {
      id: "to-pdf",
      titleKey: "toPdf",
      toolIds: ["word-to-pdf"],
    },
    {
      id: "from-pdf",
      titleKey: "fromPdf",
      toolIds: ["pdf-to-word", "pdf-to-ppt", "pdf-to-excel"],
    },
  ],
  video: [
    {
      id: "video",
      titleKey: "videoTools",
      toolIds: ["mp4-to-webm"],
    },
  ],
  audio: [
    {
      id: "audio",
      titleKey: "audioTools",
      toolIds: ["merge-audio"],
    },
  ],
};
