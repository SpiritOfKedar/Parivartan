import type * as OrtNamespace from "onnxruntime-web";
import {
  baseName,
  encodeCanvas,
  loadImage,
  renderScaledToCanvas,
} from "./image-io";
import { getOnnxSession } from "./onnx-session";

const EDSR_X2_MODEL_URL = "/models/edsr-x2.onnx";

export interface UpscaleImageResult {
  blob: Blob;
  fileName: string;
  originalWidth: number;
  originalHeight: number;
  outputWidth: number;
  outputHeight: number;
  usedOnnx: boolean;
}

function canvasToTensor(
  canvas: HTMLCanvasElement,
  ort: typeof OrtNamespace,
): OrtNamespace.Tensor {
  const width = canvas.width;
  const height = canvas.height;
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Could not create canvas context.");
  }

  const { data } = context.getImageData(0, 0, width, height);
  const floats = new Float32Array(3 * width * height);

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const pixel = (y * width + x) * 4;
      const offset = y * width + x;
      floats[offset] = data[pixel]! / 255;
      floats[width * height + offset] = data[pixel + 1]! / 255;
      floats[2 * width * height + offset] = data[pixel + 2]! / 255;
    }
  }

  return new ort.Tensor("float32", floats, [1, 3, height, width]);
}

function imageToCanvas(image: HTMLImageElement): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Could not create canvas context.");
  }
  context.drawImage(image, 0, 0);
  return canvas;
}

function tensorToCanvas(tensor: OrtNamespace.Tensor): HTMLCanvasElement {
  const dims = tensor.dims;
  if (dims.length !== 4) {
    throw new Error("Unexpected upscale output shape.");
  }

  const height = dims[2]!;
  const width = dims[3]!;
  const data = tensor.data as Float32Array;
  const channelSize = width * height;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Could not create canvas context.");
  }

  const imageData = context.createImageData(width, height);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const offset = y * width + x;
      const pixel = offset * 4;
      imageData.data[pixel] = Math.round(
        Math.min(1, Math.max(0, data[offset]!)) * 255,
      );
      imageData.data[pixel + 1] = Math.round(
        Math.min(1, Math.max(0, data[channelSize + offset]!)) * 255,
      );
      imageData.data[pixel + 2] = Math.round(
        Math.min(1, Math.max(0, data[2 * channelSize + offset]!)) * 255,
      );
      imageData.data[pixel + 3] = 255;
    }
  }

  context.putImageData(imageData, 0, 0);
  return canvas;
}

async function upscaleWithOnnx(
  image: HTMLImageElement,
  passes: number,
): Promise<HTMLCanvasElement> {
  const ort = await import("onnxruntime-web");
  const session = await getOnnxSession(EDSR_X2_MODEL_URL);
  const inputName = session.inputNames[0];
  const outputName = session.outputNames[0];
  if (!inputName || !outputName) {
    throw new Error("Upscale model is missing input or output bindings.");
  }

  let canvas = imageToCanvas(image);

  for (let pass = 0; pass < passes; pass += 1) {
    const tensor = canvasToTensor(canvas, ort);
    const result = await session.run({ [inputName]: tensor });
    const output = result[outputName];
    if (!output) {
      throw new Error("Upscale model returned no output.");
    }
    canvas = tensorToCanvas(output);
  }

  return canvas;
}

async function upscaleWithCanvas(
  image: HTMLImageElement,
  scale: 2 | 4,
): Promise<HTMLCanvasElement> {
  return renderScaledToCanvas(image, scale);
}

export async function upscaleImage(
  file: File,
  scale: 2 | 4,
): Promise<UpscaleImageResult> {
  const image = await loadImage(file);
  const passes = scale === 4 ? 2 : 1;
  let canvas: HTMLCanvasElement;
  let usedOnnx = false;

  try {
    canvas = await upscaleWithOnnx(image, passes);
    usedOnnx = true;
  } catch {
    canvas = await upscaleWithCanvas(image, scale);
  }

  const blob = await encodeCanvas(canvas, "image/png");

  return {
    blob,
    fileName: `${baseName(file.name)}-upscaled.png`,
    originalWidth: image.naturalWidth,
    originalHeight: image.naturalHeight,
    outputWidth: canvas.width,
    outputHeight: canvas.height,
    usedOnnx,
  };
}
