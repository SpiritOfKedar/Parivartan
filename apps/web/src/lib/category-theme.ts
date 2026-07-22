import type { ToolDefinition } from "@convert-hub/shared";

export type CategoryId = ToolDefinition["category"];

export type CategoryLayout = "tiles" | "ledger" | "cinema" | "waveform";

export interface CategoryTheme {
  id: CategoryId;
  label: string;
  tagline: string;
  blurb: string;
  layout: CategoryLayout;
  /** CSS color for the accent + a soft translucent variant. */
  accentVar: string;
  accentSoftVar: string;
}

export const categoryThemes: Record<CategoryId, CategoryTheme> = {
  image: {
    id: "image",
    label: "Images",
    tagline: "Craft, convert, and clean up",
    blurb:
      "Crop, resize, convert, watermark, and retouch. Every pixel handled right in your browser.",
    layout: "tiles",
    accentVar: "var(--accent-image)",
    accentSoftVar: "var(--accent-image-soft)",
  },
  pdf: {
    id: "pdf",
    label: "PDF & Documents",
    tagline: "Shape your documents",
    blurb:
      "Merge, split, compress, protect, and edit PDFs. Office conversions run on our servers.",
    layout: "ledger",
    accentVar: "var(--accent-pdf)",
    accentSoftVar: "var(--accent-pdf-soft)",
  },
  office: {
    id: "office",
    label: "Office",
    tagline: "Convert between formats",
    blurb: "Turn PDFs into editable Word, PowerPoint, and Excel, and back.",
    layout: "ledger",
    accentVar: "var(--accent-office)",
    accentSoftVar: "var(--accent-office-soft)",
  },
  video: {
    id: "video",
    label: "Video",
    tagline: "Reformat and compress",
    blurb: "Transcode and shrink footage without leaving the page.",
    layout: "cinema",
    accentVar: "var(--accent-video)",
    accentSoftVar: "var(--accent-video-soft)",
  },
  audio: {
    id: "audio",
    label: "Audio",
    tagline: "Mix, trim, and merge",
    blurb: "Combine tracks, trim clips, and export clean MP3 or WAV files.",
    layout: "waveform",
    accentVar: "var(--accent-audio)",
    accentSoftVar: "var(--accent-audio-soft)",
  },
};

export function getCategoryTheme(category: CategoryId): CategoryTheme {
  return categoryThemes[category];
}

/** Inline style object that sets the active accent for a subtree. */
export function accentStyle(
  category: CategoryId,
): { ["--accent"]: string; ["--accent-soft"]: string } {
  const theme = categoryThemes[category];
  return {
    ["--accent"]: theme.accentVar,
    ["--accent-soft"]: theme.accentSoftVar,
  } as { ["--accent"]: string; ["--accent-soft"]: string };
}
