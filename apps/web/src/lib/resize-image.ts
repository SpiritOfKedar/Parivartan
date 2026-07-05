import {
  baseName,
  encodeCanvas,
  loadImage,
  outputExtension,
  outputMimeTypeFor,
  renderToCanvas,
  type ImageOutputFormat,
} from "./image-io";

export interface ResizeImageOptions {
  width: number;
  height: number;
  lockAspectRatio: boolean;
  format?: ImageOutputFormat;
}

export interface ResizeImageResult {
  blob: Blob;
  fileName: string;
  originalWidth: number;
  originalHeight: number;
  outputWidth: number;
  outputHeight: number;
  outputMimeType: string;
}

function clampDimension(value: number): number {
  return Math.max(1, Math.floor(value));
}

export function dimensionsFromPercent(
  naturalWidth: number,
  naturalHeight: number,
  percent: number,
): { width: number; height: number } {
  const scale = percent / 100;
  return {
    width: clampDimension(naturalWidth * scale),
    height: clampDimension(naturalHeight * scale),
  };
}

export function fitDimensions(
  naturalWidth: number,
  naturalHeight: number,
  targetWidth: number,
  targetHeight: number,
  lockAspectRatio: boolean,
): { width: number; height: number } {
  const width = clampDimension(targetWidth);
  const height = clampDimension(targetHeight);

  if (!lockAspectRatio) {
    return { width, height };
  }

  const widthScale = width / naturalWidth;
  const heightScale = height / naturalHeight;
  const scale = Math.min(widthScale, heightScale);

  return {
    width: clampDimension(naturalWidth * scale),
    height: clampDimension(naturalHeight * scale),
  };
}

export async function resizeImage(
  file: File,
  options: ResizeImageOptions,
): Promise<ResizeImageResult> {
  const image = await loadImage(file);
  const { width, height } = fitDimensions(
    image.naturalWidth,
    image.naturalHeight,
    options.width,
    options.height,
    options.lockAspectRatio,
  );

  const mimeType = outputMimeTypeFor(file, options.format);
  const canvas = renderToCanvas(image, width, height);
  const quality = mimeType === "image/png" ? undefined : 0.92;
  const blob = await encodeCanvas(canvas, mimeType, quality);

  return {
    blob,
    fileName: `${baseName(file.name)}-resized${outputExtension(mimeType)}`,
    originalWidth: image.naturalWidth,
    originalHeight: image.naturalHeight,
    outputWidth: width,
    outputHeight: height,
    outputMimeType: mimeType,
  };
}
