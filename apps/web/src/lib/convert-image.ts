import {
  baseName,
  encodeCanvas,
  loadImage,
  outputExtension,
  renderToCanvas,
  type ImageOutputFormat,
} from "./image-io";

export interface ConvertImageResult {
  blob: Blob;
  fileName: string;
  outputMimeType: string;
}

export async function convertImageFormat(
  file: File,
  format: ImageOutputFormat,
  quality = 0.92,
): Promise<ConvertImageResult> {
  const image = await loadImage(file);
  const canvas = renderToCanvas(
    image,
    image.naturalWidth,
    image.naturalHeight,
  );

  const mimeType =
    format === "png"
      ? "image/png"
      : format === "webp"
        ? "image/webp"
        : "image/jpeg";

  let outputCanvas = canvas;
  if (mimeType === "image/jpeg") {
    // Flatten transparency onto white for JPEG.
    const flattened = document.createElement("canvas");
    flattened.width = canvas.width;
    flattened.height = canvas.height;
    const flatCtx = flattened.getContext("2d");
    if (!flatCtx) {
      throw new Error("Could not create canvas context.");
    }
    flatCtx.fillStyle = "#ffffff";
    flatCtx.fillRect(0, 0, flattened.width, flattened.height);
    flatCtx.drawImage(canvas, 0, 0);
    outputCanvas = flattened;
  }

  const blob = await encodeCanvas(
    outputCanvas,
    mimeType,
    mimeType === "image/png" ? undefined : quality,
  );

  return {
    blob,
    fileName: `${baseName(file.name)}${outputExtension(mimeType)}`,
    outputMimeType: mimeType,
  };
}

export async function imagesToAnimatedGif(
  files: File[],
  delayMs = 400,
): Promise<ConvertImageResult> {
  if (files.length === 0) {
    throw new Error("Add at least one image.");
  }

  // Simple multi-frame GIF via canvas frames encoded as a looping APNG-like
  // fallback isn't available without a GIF encoder. Encode as WebP animation
  // isn't universal either — so we stitch frames onto a sprite strip PNG when
  // only one frame, or use a lightweight GIF89a encoder for multiple frames.
  if (files.length === 1) {
    return convertImageFormat(files[0]!, "png");
  }

  const images = await Promise.all(files.map((file) => loadImage(file)));
  const width = Math.max(...images.map((image) => image.naturalWidth));
  const height = Math.max(...images.map((image) => image.naturalHeight));

  const frames = images.map((image) => {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("Could not create canvas context.");
    }
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, width, height);
    context.drawImage(
      image,
      Math.floor((width - image.naturalWidth) / 2),
      Math.floor((height - image.naturalHeight) / 2),
    );
    return context.getImageData(0, 0, width, height);
  });

  const { encodeGif } = await import("./gif-encoder");
  const blob = encodeGif(frames, width, height, delayMs);

  return {
    blob,
    fileName: "animated.gif",
    outputMimeType: "image/gif",
  };
}
