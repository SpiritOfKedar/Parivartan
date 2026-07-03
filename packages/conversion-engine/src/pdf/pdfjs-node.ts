import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { pathToFileURL } from "node:url";
import { createCanvas } from "canvas";
import type { PDFDocumentProxy, PDFPageProxy } from "pdfjs-dist";

const require = createRequire(import.meta.url);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PdfJsModule = any;

let pdfjsModule: PdfJsModule | null = null;

async function getPdfjs(): Promise<PdfJsModule> {
  if (!pdfjsModule) {
    pdfjsModule = await import("pdfjs-dist/legacy/build/pdf.mjs");
    const workerPath = require.resolve("pdfjs-dist/legacy/build/pdf.worker.mjs");
    pdfjsModule.GlobalWorkerOptions.workerSrc = pathToFileURL(workerPath).href;
  }
  return pdfjsModule;
}

function standardFontDataUrl(): string {
  const standardFontsDir = dirname(
    require.resolve("pdfjs-dist/standard_fonts/FoxitSymbol.pfb"),
  );
  return pathToFileURL(join(standardFontsDir, "/")).href;
}

export async function loadPdfDocument(data: Buffer): Promise<PDFDocumentProxy> {
  const pdfjs = await getPdfjs();
  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(data),
    useSystemFonts: true,
    isEvalSupported: false,
    standardFontDataUrl: standardFontDataUrl(),
  });
  return loadingTask.promise as Promise<PDFDocumentProxy>;
}

export async function renderPageToJpeg(
  page: PDFPageProxy,
  scale = 2,
  quality = 0.92,
): Promise<Buffer> {
  const viewport = page.getViewport({ scale });
  const canvas = createCanvas(
    Math.floor(viewport.width),
    Math.floor(viewport.height),
  );
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Could not create canvas context.");
  }

  await page.render({
    canvasContext: context as unknown as CanvasRenderingContext2D,
    viewport,
  }).promise;

  return canvas.toBuffer("image/jpeg", { quality });
}
