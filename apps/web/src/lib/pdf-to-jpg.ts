import JSZip from "jszip";
import type { PDFDocumentProxy, PDFPageProxy } from "pdfjs-dist";
import { getPdfjs } from "./pdfjs";

export type JpegQuality = "high" | "medium";

const QUALITY_VALUES: Record<JpegQuality, number> = {
  high: 0.92,
  medium: 0.78,
};

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

export async function getPdfPageCount(file: File): Promise<number> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const pdfjs = await getPdfjs();
  const pdf: PDFDocumentProxy = await pdfjs.getDocument({ data: bytes }).promise;
  return pdf.numPages;
}

export interface PdfToJpgResult {
  blob: Blob;
  fileName: string;
  pageCount: number;
}

export async function convertPdfToJpg(
  file: File,
  quality: JpegQuality,
): Promise<PdfToJpgResult> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const pdfjs = await getPdfjs();
  const pdf: PDFDocumentProxy = await pdfjs.getDocument({ data: bytes }).promise;
  const jpegQuality = QUALITY_VALUES[quality];
  const stem = file.name.replace(/\.pdf$/i, "") || "document";

  if (pdf.numPages === 1) {
    const page = await pdf.getPage(1);
    const canvas = await renderPage(page, 2);
    const jpegBytes = await canvasToJpegBytes(canvas, jpegQuality);
    return {
      blob: new Blob([jpegBytes.slice()], { type: "image/jpeg" }),
      fileName: `${stem}.jpg`,
      pageCount: 1,
    };
  }

  const zip = new JSZip();
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum += 1) {
    const page = await pdf.getPage(pageNum);
    const canvas = await renderPage(page, 2);
    const jpegBytes = await canvasToJpegBytes(canvas, jpegQuality);
    zip.file(`${stem}-page-${pageNum}.jpg`, jpegBytes);
  }

  const zipBytes = await zip.generateAsync({ type: "uint8array" });
  return {
    blob: new Blob([zipBytes.slice()], { type: "application/zip" }),
    fileName: `${stem}-pages.zip`,
    pageCount: pdf.numPages,
  };
}
