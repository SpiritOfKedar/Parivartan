import {
  baseName,
  encodeCanvas,
  loadImage,
  outputExtension,
  outputMimeTypeFor,
  type ImageOutputFormat,
} from "./image-io";

export type WatermarkPosition =
  | "center"
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right";

export interface WatermarkImageOptions {
  text?: string;
  watermarkFile?: File;
  opacity: number;
  position: WatermarkPosition;
  format?: ImageOutputFormat;
}

export interface WatermarkImageResult {
  blob: Blob;
  fileName: string;
  outputMimeType: string;
}

function positionPoint(
  position: WatermarkPosition,
  baseW: number,
  baseH: number,
  markW: number,
  markH: number,
  padding: number,
): { x: number; y: number } {
  switch (position) {
    case "top-left":
      return { x: padding, y: padding };
    case "top-right":
      return { x: baseW - markW - padding, y: padding };
    case "bottom-left":
      return { x: padding, y: baseH - markH - padding };
    case "bottom-right":
      return { x: baseW - markW - padding, y: baseH - markH - padding };
    case "center":
    default:
      return {
        x: (baseW - markW) / 2,
        y: (baseH - markH) / 2,
      };
  }
}

export async function watermarkImage(
  file: File,
  options: WatermarkImageOptions,
): Promise<WatermarkImageResult> {
  const image = await loadImage(file);
  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Could not create canvas context.");
  }

  context.drawImage(image, 0, 0);
  context.save();
  context.globalAlpha = Math.min(1, Math.max(0, options.opacity));

  if (options.watermarkFile) {
    const mark = await loadImage(options.watermarkFile);
    const maxW = image.naturalWidth * 0.35;
    const maxH = image.naturalHeight * 0.35;
    const scale = Math.min(1, maxW / mark.naturalWidth, maxH / mark.naturalHeight);
    const markW = mark.naturalWidth * scale;
    const markH = mark.naturalHeight * scale;
    const { x, y } = positionPoint(
      options.position,
      image.naturalWidth,
      image.naturalHeight,
      markW,
      markH,
      Math.round(Math.min(image.naturalWidth, image.naturalHeight) * 0.04),
    );
    context.drawImage(mark, x, y, markW, markH);
  } else {
    const text = (options.text ?? "").trim();
    if (!text) {
      throw new Error("Enter watermark text or choose an image.");
    }
    const fontSize = Math.max(
      16,
      Math.round(Math.min(image.naturalWidth, image.naturalHeight) * 0.06),
    );
    context.font = `bold ${fontSize}px system-ui, sans-serif`;
    context.fillStyle = "#ffffff";
    context.strokeStyle = "rgba(0,0,0,0.45)";
    context.lineWidth = Math.max(1, Math.round(fontSize * 0.08));
    const metrics = context.measureText(text);
    const markW = metrics.width;
    const markH = fontSize;
    const { x, y } = positionPoint(
      options.position,
      image.naturalWidth,
      image.naturalHeight,
      markW,
      markH,
      Math.round(Math.min(image.naturalWidth, image.naturalHeight) * 0.04),
    );
    context.strokeText(text, x, y + fontSize);
    context.fillText(text, x, y + fontSize);
  }

  context.restore();

  const mimeType = outputMimeTypeFor(file, options.format);
  const quality = mimeType === "image/png" ? undefined : 0.92;
  const blob = await encodeCanvas(canvas, mimeType, quality);

  return {
    blob,
    fileName: `${baseName(file.name)}-watermarked${outputExtension(mimeType)}`,
    outputMimeType: mimeType,
  };
}
