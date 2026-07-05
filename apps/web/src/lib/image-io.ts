export type ImageOutputFormat = "jpeg" | "png" | "webp";

export function baseName(fileName: string): string {
  const dot = fileName.lastIndexOf(".");
  return dot > 0 ? fileName.slice(0, dot) : fileName;
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

export function outputMimeTypeFor(
  file: File,
  format?: ImageOutputFormat,
): string {
  if (format === "png") {
    return "image/png";
  }
  if (format === "webp") {
    return "image/webp";
  }
  if (format === "jpeg") {
    return "image/jpeg";
  }

  const lower = file.name.toLowerCase();
  if (file.type === "image/png" || lower.endsWith(".png")) {
    return "image/png";
  }
  if (file.type === "image/webp" || lower.endsWith(".webp")) {
    return "image/webp";
  }
  return "image/jpeg";
}

export function outputExtension(mimeType: string): string {
  if (mimeType === "image/png") {
    return ".png";
  }
  if (mimeType === "image/webp") {
    return ".webp";
  }
  return ".jpg";
}

export function loadImage(file: File): Promise<HTMLImageElement> {
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

export function encodeCanvas(
  canvas: HTMLCanvasElement,
  mimeType: string,
  quality = 0.92,
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

export function renderToCanvas(
  image: HTMLImageElement,
  width: number,
  height: number,
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.floor(width));
  canvas.height = Math.max(1, Math.floor(height));
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Could not create canvas context.");
  }
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas;
}

export function renderScaledToCanvas(
  image: HTMLImageElement,
  scale: number,
): HTMLCanvasElement {
  return renderToCanvas(
    image,
    image.naturalWidth * scale,
    image.naturalHeight * scale,
  );
}
