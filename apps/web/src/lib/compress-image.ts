import {
  baseName,
  encodeCanvas,
  isSupportedImage,
  loadImage,
  outputExtension,
  outputMimeTypeFor,
  renderScaledToCanvas,
} from "./image-io";

export interface CompressImageResult {
  blob: Blob;
  fileName: string;
  originalBytes: number;
  compressedBytes: number;
  reachedTarget: boolean;
  outputMimeType: string;
}

export { isSupportedImage };

const SCALES = [1, 0.85, 0.7, 0.55, 0.4, 0.3];

async function encodeAtQuality(
  image: HTMLImageElement,
  scale: number,
  mimeType: string,
  quality: number,
): Promise<Blob> {
  const canvas = renderScaledToCanvas(image, scale);
  return encodeCanvas(canvas, mimeType, quality);
}

async function bestBlobUnderTarget(
  image: HTMLImageElement,
  mimeType: string,
  targetBytes: number,
): Promise<{ blob: Blob; reachedTarget: boolean }> {
  let bestUnder: Blob | null = null;
  let bestOverall: Blob | null = null;

  for (const scale of SCALES) {
    let low = 0.1;
    let high = 0.95;
    let scaleBest: Blob | null = null;

    for (let attempt = 0; attempt < 8; attempt += 1) {
      const mid = (low + high) / 2;
      const blob = await encodeAtQuality(image, scale, mimeType, mid);

      if (!bestOverall || blob.size < bestOverall.size) {
        bestOverall = blob;
      }

      if (blob.size <= targetBytes) {
        scaleBest = blob;
        low = mid;
      } else {
        high = mid;
      }
    }

    if (scaleBest) {
      const previousBest = bestUnder;
      if (!previousBest || scaleBest.size > previousBest.size) {
        bestUnder = scaleBest;
      }
    }
  }

  if (bestUnder) {
    return { blob: bestUnder, reachedTarget: true };
  }

  if (!bestOverall) {
    throw new Error("Could not compress this image.");
  }

  return { blob: bestOverall, reachedTarget: bestOverall.size <= targetBytes };
}

export async function compressImageToTarget(
  file: File,
  targetKb: number,
): Promise<CompressImageResult> {
  const targetBytes = Math.max(1, targetKb) * 1024;
  const image = await loadImage(file);
  const mimeType = outputMimeTypeFor(file);
  const { blob, reachedTarget } = await bestBlobUnderTarget(
    image,
    mimeType,
    targetBytes,
  );

  return {
    blob,
    fileName: `${baseName(file.name)}-compressed${outputExtension(mimeType)}`,
    originalBytes: file.size,
    compressedBytes: blob.size,
    reachedTarget,
    outputMimeType: mimeType,
  };
}
