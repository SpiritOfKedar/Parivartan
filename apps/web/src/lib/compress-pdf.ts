import { PDFDocument } from "pdf-lib";
import type { PDFDocumentProxy, PDFPageProxy } from "pdfjs-dist";
import * as pdfjs from "pdfjs-dist";

let workerReady = false;

async function ensurePdfWorker(): Promise<void> {
  if (workerReady) {
    return;
  }
  const { version } = await import("pdfjs-dist/package.json");
  pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${version}/build/pdf.worker.min.mjs`;
  workerReady = true;
}

export type CompressQualityMode = "preserve" | "balanced" | "smallest";

export type CompressMethod = "lossless" | "rasterize";

export interface CompressPdfProgress {
  phase: "loading" | "optimizing" | "rendering" | "encoding";
  current: number;
  total: number;
}

export interface CompressPdfResult {
  bytes: Uint8Array;
  originalBytes: number;
  compressedBytes: number;
  reachedTarget: boolean;
  method: CompressMethod;
  textPreserved: boolean;
  quality: number;
  scale: number;
}

interface RasterTier {
  scales: number[];
  minQuality: number;
  maxQuality: number;
}

const RASTER_TIERS: Record<Exclude<CompressQualityMode, "preserve">, RasterTier[]> = {
  balanced: [
    { scales: [2.5, 2.0, 1.75, 1.5], minQuality: 0.78, maxQuality: 0.95 },
    { scales: [1.5, 1.25, 1.0], minQuality: 0.62, maxQuality: 0.85 },
    { scales: [1.0, 0.85, 0.7], minQuality: 0.45, maxQuality: 0.7 },
  ],
  smallest: [
    { scales: [1.5, 1.25, 1.0, 0.85, 0.7, 0.55, 0.4, 0.3], minQuality: 0.1, maxQuality: 0.95 },
  ],
};

const QUALITY_PRECISION = 0.02;

async function losslessOptimize(input: Uint8Array): Promise<Uint8Array | null> {
  try {
    const doc = await PDFDocument.load(input, { ignoreEncryption: false });
    return await doc.save({ useObjectStreams: true });
  } catch {
    return null;
  }
}

function canvasToJpegBytes(
  canvas: HTMLCanvasElement,
  quality: number,
): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      async (blob) => {
        if (!blob) {
          reject(new Error("Failed to encode page image."));
          return;
        }
        resolve(new Uint8Array(await blob.arrayBuffer()));
      },
      "image/jpeg",
      quality,
    );
  });
}

async function renderPage(
  page: PDFPageProxy,
  scale: number,
): Promise<HTMLCanvasElement> {
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement("canvas");
  canvas.width = Math.floor(viewport.width);
  canvas.height = Math.floor(viewport.height);
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Could not create canvas context.");
  }
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  await page.render({ canvasContext: context, viewport, canvas }).promise;
  return canvas;
}

async function buildPdfFromJpegs(
  pageImages: { bytes: Uint8Array; width: number; height: number }[],
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  for (const { bytes, width, height } of pageImages) {
    const jpg = await pdfDoc.embedJpg(bytes);
    const page = pdfDoc.addPage([width, height]);
    page.drawImage(jpg, { x: 0, y: 0, width, height });
  }
  return pdfDoc.save({ useObjectStreams: true });
}

async function encodePagesAtQuality(
  canvases: HTMLCanvasElement[],
  quality: number,
): Promise<{ bytes: Uint8Array; width: number; height: number }[]> {
  const pageImages: { bytes: Uint8Array; width: number; height: number }[] = [];
  for (const canvas of canvases) {
    const bytes = await canvasToJpegBytes(canvas, quality);
    pageImages.push({
      bytes,
      width: canvas.width,
      height: canvas.height,
    });
  }
  return pageImages;
}

function makeResult(
  bytes: Uint8Array,
  originalBytes: number,
  targetBytes: number,
  method: CompressMethod,
  quality: number,
  scale: number,
): CompressPdfResult {
  const compressedBytes = bytes.byteLength;
  return {
    bytes,
    originalBytes,
    compressedBytes,
    reachedTarget: compressedBytes <= targetBytes,
    method,
    textPreserved: method === "lossless",
    quality,
    scale,
  };
}

function pickBetter(
  current: CompressPdfResult | null,
  candidate: CompressPdfResult,
  targetBytes: number,
): CompressPdfResult {
  if (!current) {
    return candidate;
  }

  const currentDist = Math.abs(current.compressedBytes - targetBytes);
  const candidateDist = Math.abs(candidate.compressedBytes - targetBytes);

  if (candidate.reachedTarget && !current.reachedTarget) {
    return candidate;
  }
  if (!candidate.reachedTarget && current.reachedTarget) {
    return current;
  }
  if (candidate.reachedTarget && current.reachedTarget) {
    return candidate.quality > current.quality ? candidate : current;
  }
  return candidateDist < currentDist ? candidate : current;
}

async function rasterizeToTarget(
  pages: PDFPageProxy[],
  originalBytes: number,
  targetBytes: number,
  tier: RasterTier,
  onProgress?: (progress: CompressPdfProgress) => void,
): Promise<CompressPdfResult | null> {
  const pageCount = pages.length;
  let bestResult: CompressPdfResult | null = null;
  let smallestResult: CompressPdfResult | null = null;

  for (const scale of tier.scales) {
    onProgress?.({ phase: "rendering", current: 0, total: pageCount });

    const canvases: HTMLCanvasElement[] = [];
    for (let i = 0; i < pages.length; i++) {
      canvases.push(await renderPage(pages[i]!, scale));
      onProgress?.({ phase: "rendering", current: i + 1, total: pageCount });
    }

    let low = tier.minQuality;
    let high = tier.maxQuality;
    let scaleBest: CompressPdfResult | null = null;

    while (high - low > QUALITY_PRECISION) {
      const mid = (low + high) / 2;
      onProgress?.({ phase: "encoding", current: 0, total: pageCount });

      const pageImages = await encodePagesAtQuality(canvases, mid);
      const pdfBytes = await buildPdfFromJpegs(pageImages);
      const candidate = makeResult(
        pdfBytes,
        originalBytes,
        targetBytes,
        "rasterize",
        mid,
        scale,
      );

      if (
        !smallestResult ||
        candidate.compressedBytes < smallestResult.compressedBytes
      ) {
        smallestResult = candidate;
      }

      if (candidate.compressedBytes <= targetBytes) {
        scaleBest = candidate;
        low = mid;
      } else {
        high = mid;
      }
    }

    if (scaleBest) {
      bestResult = scaleBest;
      break;
    }
  }

  return bestResult ?? smallestResult;
}

export async function compressPdfToTarget(
  file: File,
  targetBytes: number,
  options?: {
    mode?: CompressQualityMode;
    onProgress?: (progress: CompressPdfProgress) => void;
  },
): Promise<CompressPdfResult> {
  const mode = options?.mode ?? "balanced";
  const onProgress = options?.onProgress;

  const originalBytes = file.size;
  const input = new Uint8Array(await file.arrayBuffer());

  onProgress?.({ phase: "optimizing", current: 0, total: 1 });
  const losslessBytes = await losslessOptimize(input);
  const optimizedBytes = losslessBytes ?? input;
  const losslessResult = makeResult(
    optimizedBytes,
    originalBytes,
    targetBytes,
    "lossless",
    1,
    1,
  );

  if (losslessResult.reachedTarget || mode === "preserve") {
    return losslessResult;
  }

  try {
    await ensurePdfWorker();

    onProgress?.({ phase: "loading", current: 0, total: 1 });
    const pdf: PDFDocumentProxy = await pdfjs.getDocument({ data: input }).promise;
    const pageCount = pdf.numPages;

    const pages: PDFPageProxy[] = [];
    for (let i = 1; i <= pageCount; i++) {
      pages.push(await pdf.getPage(i));
    }

    let bestResult: CompressPdfResult | null = null;
    if (losslessResult.compressedBytes < originalBytes) {
      bestResult = losslessResult;
    }

    for (const tier of RASTER_TIERS[mode]) {
      const rasterResult = await rasterizeToTarget(
        pages,
        originalBytes,
        targetBytes,
        tier,
        onProgress,
      );

      if (!rasterResult) {
        continue;
      }

      bestResult = pickBetter(bestResult, rasterResult, targetBytes);

      if (rasterResult.reachedTarget) {
        return rasterResult;
      }
    }

    if (bestResult) {
      if (bestResult.compressedBytes >= originalBytes) {
        return makeResult(input, originalBytes, targetBytes, "lossless", 1, 1);
      }
      return bestResult;
    }
  } catch {
    // Fall through to lossless / original below.
  }

  if (losslessResult.compressedBytes < originalBytes) {
    return losslessResult;
  }

  return makeResult(input, originalBytes, targetBytes, "lossless", 1, 1);
}
