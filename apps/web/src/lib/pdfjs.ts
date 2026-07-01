type PdfJsModule = typeof import("pdfjs-dist");

let pdfjsModule: PdfJsModule | null = null;
let workerReady = false;

export async function getPdfjs(): Promise<PdfJsModule> {
  if (typeof window === "undefined") {
    throw new Error("PDF.js is only available in the browser.");
  }

  if (!pdfjsModule) {
    pdfjsModule = await import("pdfjs-dist");
  }

  if (!workerReady) {
    const { version } = await import("pdfjs-dist/package.json");
    pdfjsModule.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${version}/build/pdf.worker.min.mjs`;
    workerReady = true;
  }

  return pdfjsModule;
}
