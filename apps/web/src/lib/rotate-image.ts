import {
  baseName,
  encodeCanvas,
  loadImage,
  outputExtension,
  outputMimeTypeFor,
  type ImageOutputFormat,
} from "./image-io";

export type RotateDegrees = 90 | 180 | 270;

export interface RotateImageResult {
  blob: Blob;
  fileName: string;
  width: number;
  height: number;
  outputMimeType: string;
}

export async function rotateImage(
  file: File,
  degrees: RotateDegrees,
  format?: ImageOutputFormat,
): Promise<RotateImageResult> {
  const image = await loadImage(file);
  const swap = degrees === 90 || degrees === 270;
  const width = swap ? image.naturalHeight : image.naturalWidth;
  const height = swap ? image.naturalWidth : image.naturalHeight;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Could not create canvas context.");
  }

  context.translate(width / 2, height / 2);
  context.rotate((degrees * Math.PI) / 180);
  context.drawImage(
    image,
    -image.naturalWidth / 2,
    -image.naturalHeight / 2,
  );

  const mimeType = outputMimeTypeFor(file, format);
  const quality = mimeType === "image/png" ? undefined : 0.92;
  const blob = await encodeCanvas(canvas, mimeType, quality);

  return {
    blob,
    fileName: `${baseName(file.name)}-rotated${outputExtension(mimeType)}`,
    width,
    height,
    outputMimeType: mimeType,
  };
}
