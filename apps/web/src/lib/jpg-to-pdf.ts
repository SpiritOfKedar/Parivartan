import { PDFDocument, PageSizes } from "pdf-lib";

export interface ImageInput {
  file: File;
  bytes: Uint8Array;
  mimeType: string;
  width: number;
  height: number;
}

async function loadImageFromFile(file: File): Promise<ImageInput> {
  const mimeType = file.type || guessMimeType(file.name);
  const bytes = new Uint8Array(await file.arrayBuffer());

  if (mimeType === "image/webp") {
    const converted = await webpToPngBytes(bytes);
    return {
      file,
      bytes: converted.bytes,
      mimeType: "image/png",
      width: converted.width,
      height: converted.height,
    };
  }

  const dimensions = await readImageDimensions(bytes, mimeType);
  return { file, bytes, mimeType, ...dimensions };
}

function guessMimeType(name: string): string {
  const lower = name.toLowerCase();
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".webp")) return "image/webp";
  return "image/jpeg";
}

function readImageDimensions(
  bytes: Uint8Array,
  mimeType: string,
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const blob = new Blob([bytes.slice()], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read image dimensions."));
    };
    img.src = url;
  });
}

async function webpToPngBytes(
  bytes: Uint8Array,
): Promise<{ bytes: Uint8Array; width: number; height: number }> {
  const blob = new Blob([bytes.slice()], { type: "image/webp" });
  const url = URL.createObjectURL(blob);
  const img = new Image();

  try {
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("Could not decode WebP image."));
      img.src = url;
    });

    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("Could not create canvas context.");
    }
    context.drawImage(img, 0, 0);

    const pngBlob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((result) => {
        if (!result) {
          reject(new Error("Could not convert WebP to PNG."));
          return;
        }
        resolve(result);
      }, "image/png");
    });

    return {
      bytes: new Uint8Array(await pngBlob.arrayBuffer()),
      width: img.naturalWidth,
      height: img.naturalHeight,
    };
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function imagesToPdf(files: File[]): Promise<Uint8Array> {
  if (files.length === 0) {
    throw new Error("Add at least one image.");
  }

  const images = await Promise.all(files.map(loadImageFromFile));
  const pdfDoc = await PDFDocument.create();
  const [pageWidth, pageHeight] = PageSizes.A4;
  const margin = 36;

  for (const image of images) {
    const embedded =
      image.mimeType === "image/png"
        ? await pdfDoc.embedPng(image.bytes)
        : await pdfDoc.embedJpg(image.bytes);

    const maxWidth = pageWidth - margin * 2;
    const maxHeight = pageHeight - margin * 2;
    const scale = Math.min(maxWidth / image.width, maxHeight / image.height, 1);
    const drawWidth = image.width * scale;
    const drawHeight = image.height * scale;
    const x = (pageWidth - drawWidth) / 2;
    const y = (pageHeight - drawHeight) / 2;

    const page = pdfDoc.addPage([pageWidth, pageHeight]);
    page.drawImage(embedded, {
      x,
      y,
      width: drawWidth,
      height: drawHeight,
    });
  }

  return pdfDoc.save({ useObjectStreams: true });
}

export function isSupportedImage(file: File): boolean {
  const lower = file.name.toLowerCase();
  return (
    file.type === "image/jpeg" ||
    file.type === "image/png" ||
    file.type === "image/webp" ||
    lower.endsWith(".jpg") ||
    lower.endsWith(".jpeg") ||
    lower.endsWith(".png") ||
    lower.endsWith(".webp")
  );
}
