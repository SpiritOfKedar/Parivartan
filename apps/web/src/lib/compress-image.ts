export interface CompressImageResult {
  blob: Blob;
  fileName: string;
  originalBytes: number;
  compressedBytes: number;
  reachedTarget: boolean;
  outputMimeType: string;
}

const SCALES = [1, 0.85, 0.7, 0.55, 0.4, 0.3];

function baseName(fileName: string): string {
  const dot = fileName.lastIndexOf(".");
  return dot > 0 ? fileName.slice(0, dot) : fileName;
}

function outputMimeTypeFor(file: File): string {
  const lower = file.name.toLowerCase();
  if (file.type === "image/webp" || lower.endsWith(".webp")) {
    return "image/webp";
  }
  return "image/jpeg";
}

function outputExtension(mimeType: string): string {
  if (mimeType === "image/webp") {
    return ".webp";
  }
  return ".jpg";
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read this image."));
    };
    image.src = url;
  });
}

function encodeCanvas(
  canvas: HTMLCanvasElement,
  mimeType: string,
  quality: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Failed to encode image."));
          return;
        }
        resolve(blob);
      },
      mimeType,
      quality,
    );
  });
}

function renderToCanvas(
  image: HTMLImageElement,
  scale: number,
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.floor(image.naturalWidth * scale));
  canvas.height = Math.max(1, Math.floor(image.naturalHeight * scale));
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Could not create canvas context.");
  }
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas;
}

async function encodeAtQuality(
  image: HTMLImageElement,
  scale: number,
  mimeType: string,
  quality: number,
): Promise<Blob> {
  const canvas = renderToCanvas(image, scale);
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

export function isSupportedImage(file: File): boolean {
  const lower = file.name.toLowerCase();
  return (
    file.type.startsWith("image/") ||
    lower.endsWith(".jpg") ||
    lower.endsWith(".jpeg") ||
    lower.endsWith(".png") ||
    lower.endsWith(".webp") ||
    lower.endsWith(".gif")
  );
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
