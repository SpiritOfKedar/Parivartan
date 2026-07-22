import {
  baseName,
  encodeCanvas,
  loadImage,
  outputExtension,
  outputMimeTypeFor,
  type ImageOutputFormat,
} from "./image-io";

export interface CropRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CropImageResult {
  blob: Blob;
  fileName: string;
  width: number;
  height: number;
  outputMimeType: string;
}

export function normalizeCropRect(
  naturalWidth: number,
  naturalHeight: number,
  rect: CropRect,
): CropRect {
  const x = Math.max(0, Math.min(naturalWidth - 1, Math.floor(rect.x)));
  const y = Math.max(0, Math.min(naturalHeight - 1, Math.floor(rect.y)));
  const width = Math.max(
    1,
    Math.min(naturalWidth - x, Math.floor(rect.width)),
  );
  const height = Math.max(
    1,
    Math.min(naturalHeight - y, Math.floor(rect.height)),
  );
  return { x, y, width, height };
}

export async function cropImage(
  file: File,
  rect: CropRect,
  format?: ImageOutputFormat,
): Promise<CropImageResult> {
  const image = await loadImage(file);
  const crop = normalizeCropRect(
    image.naturalWidth,
    image.naturalHeight,
    rect,
  );

  const canvas = document.createElement("canvas");
  canvas.width = crop.width;
  canvas.height = crop.height;
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Could not create canvas context.");
  }

  context.drawImage(
    image,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    crop.width,
    crop.height,
  );

  const mimeType = outputMimeTypeFor(file, format);
  const quality = mimeType === "image/png" ? undefined : 0.92;
  const blob = await encodeCanvas(canvas, mimeType, quality);

  return {
    blob,
    fileName: `${baseName(file.name)}-cropped${outputExtension(mimeType)}`,
    width: crop.width,
    height: crop.height,
    outputMimeType: mimeType,
  };
}
