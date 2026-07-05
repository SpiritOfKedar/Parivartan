import { FaceDetector, FilesetResolver } from "@mediapipe/tasks-vision";
import {
  baseName,
  encodeCanvas,
  loadImage,
  outputExtension,
} from "./image-io";

export type BlurStrength = "light" | "medium" | "strong";

const BLUR_RADIUS: Record<BlurStrength, number> = {
  light: 10,
  medium: 20,
  strong: 30,
};

const MEDIAPIPE_WASM_CDN =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm";
const FACE_DETECTOR_MODEL =
  "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite";

let detectorPromise: Promise<FaceDetector> | null = null;

async function getFaceDetector(): Promise<FaceDetector> {
  if (!detectorPromise) {
    detectorPromise = (async () => {
      const wasmFileset = await FilesetResolver.forVisionTasks(MEDIAPIPE_WASM_CDN);
      return FaceDetector.createFromOptions(wasmFileset, {
        baseOptions: {
          modelAssetPath: FACE_DETECTOR_MODEL,
        },
        runningMode: "IMAGE",
        minDetectionConfidence: 0.5,
      });
    })();
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
  const scratch = document.createElement("canvas");
  scratch.width = regionWidth;
  scratch.height = regionHeight;
  const scratchContext = scratch.getContext("2d");
  if (!scratchContext) {
    return;
  }

  scratchContext.putImageData(region, 0, 0);
  scratchContext.filter = `blur(${radius}px)`;
  scratchContext.drawImage(scratch, 0, 0);
  scratchContext.filter = "none";

  context.drawImage(scratch, x1, y1);
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
  const result = detector.detect(image);
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
