import {
  baseName,
  encodeCanvas,
  outputExtension,
  type ImageOutputFormat,
} from "./image-io";

export type FilterPreset = "none" | "grayscale" | "sepia" | "vintage" | "vivid";

export interface PhotoAdjustments {
  brightness: number;
  contrast: number;
  saturation: number;
}

export const DEFAULT_ADJUSTMENTS: PhotoAdjustments = {
  brightness: 0,
  contrast: 0,
  saturation: 0,
};

export function exportStageToBlob(
  stage: {
    toCanvas: (config?: {
      pixelRatio?: number;
      x?: number;
      y?: number;
      width?: number;
      height?: number;
    }) => HTMLCanvasElement;
  },
  format: ImageOutputFormat,
  fileName: string,
): Promise<{ blob: Blob; fileName: string }> {
  const canvas = stage.toCanvas({ pixelRatio: 1 });
  const mimeType =
    format === "png"
      ? "image/png"
      : format === "webp"
        ? "image/webp"
        : "image/jpeg";
  const quality = mimeType === "image/png" ? undefined : 0.92;

  return encodeCanvas(canvas, mimeType, quality).then((blob) => ({
    blob,
    fileName: `${baseName(fileName)}-edited${outputExtension(mimeType)}`,
  }));
}

export function presetLabel(preset: FilterPreset): string {
  switch (preset) {
    case "grayscale":
      return "B&W";
    case "sepia":
      return "Sepia";
    case "vintage":
      return "Vintage";
    case "vivid":
      return "Vivid";
    default:
      return "None";
  }
}
