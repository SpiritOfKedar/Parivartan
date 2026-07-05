import type { FaceDetector } from "@mediapipe/tasks-vision";
import {
  baseName,
  encodeCanvas,
  loadImage,
  outputExtension,
} from "./image-io";

export type BlurStrength = "light" | "medium" | "strong";

const BLUR_RADIUS: Record<BlurStrength, number> = {
  light: 16,
  medium: 32,
  strong: 48,
};

const MODEL_LOAD_TIMEOUT_MS = 30_000;
const MEDIAPIPE_WASM_PATH = "/mediapipe/wasm";
const FACE_DETECTOR_MODEL = "/models/blaze_face_short_range.tflite";

type MediaPipeVision = typeof import("@mediapipe/tasks-vision");

let detectorPromise: Promise<FaceDetector> | null = null;

function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  message: string,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(message));
    }, timeoutMs);

    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((error: unknown) => {
        clearTimeout(timer);
        reject(error);
      });
  });
}

async function loadMediaPipeVision(): Promise<MediaPipeVision> {
  return import("@mediapipe/tasks-vision");
}

async function createFaceDetector(): Promise<FaceDetector> {
  const { FaceDetector, FilesetResolver } = await loadMediaPipeVision();
  const wasmFileset = await FilesetResolver.forVisionTasks(MEDIAPIPE_WASM_PATH);

  return FaceDetector.createFromOptions(wasmFileset, {
    baseOptions: {
      modelAssetPath: FACE_DETECTOR_MODEL,
    },
    runningMode: "IMAGE",
    minDetectionConfidence: 0.4,
  });
}

async function getFaceDetector(): Promise<FaceDetector> {
  if (!detectorPromise) {
    detectorPromise = withTimeout(
      createFaceDetector(),
      MODEL_LOAD_TIMEOUT_MS,
      "Face detection model took too long to load. Check your connection and try again.",
    ).catch((error: unknown) => {
      detectorPromise = null;
      throw error;
    });
  }

  return detectorPromise;
}

function blurRegion(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
): void {
  const canvas = context.canvas;
  const x1 = Math.max(0, Math.floor(x));
  const y1 = Math.max(0, Math.floor(y));
  const x2 = Math.min(canvas.width, Math.ceil(x + width));
  const y2 = Math.min(canvas.height, Math.ceil(y + height));
  const regionWidth = x2 - x1;
  const regionHeight = y2 - y1;

  if (regionWidth <= 0 || regionHeight <= 0) {
    return;
  }

  const region = context.getImageData(x1, y1, regionWidth, regionHeight);
  const source = document.createElement("canvas");
  source.width = regionWidth;
  source.height = regionHeight;
  const sourceContext = source.getContext("2d");
  if (!sourceContext) {
    return;
  }

  sourceContext.putImageData(region, 0, 0);

  const blurred = document.createElement("canvas");
  blurred.width = regionWidth;
  blurred.height = regionHeight;
  const blurredContext = blurred.getContext("2d");
  if (!blurredContext) {
    return;
  }

  blurredContext.filter = `blur(${radius}px)`;
  blurredContext.drawImage(source, 0, 0);
  blurredContext.filter = "none";

  context.drawImage(blurred, x1, y1);
}

export interface BlurFacesResult {
  blob: Blob;
  fileName: string;
  faceCount: number;
}

export async function blurFacesInImage(
  file: File,
  blurStrength: BlurStrength = "medium",
): Promise<BlurFacesResult> {
  const image = await loadImage(file);
  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Could not create canvas context.");
  }

  context.drawImage(image, 0, 0);

  const detector = await getFaceDetector();
  const result = detector.detect(canvas);
  const radius = BLUR_RADIUS[blurStrength];

  for (const detection of result.detections) {
    const box = detection.boundingBox;
    if (!box) {
      continue;
    }

    const padding = Math.round(Math.max(box.width, box.height) * 0.15);
    blurRegion(
      context,
      box.originX - padding,
      box.originY - padding,
      box.width + padding * 2,
      box.height + padding * 2,
      radius,
    );
  }

  const mimeType = "image/jpeg";
  const blob = await encodeCanvas(canvas, mimeType, 0.92);

  return {
    blob,
    fileName: `${baseName(file.name)}-blurred${outputExtension(mimeType)}`,
    faceCount: result.detections.length,
  };
}
