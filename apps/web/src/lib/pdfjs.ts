import * as pdfjs from "pdfjs-dist";

let workerReady = false;

export async function ensurePdfWorker(): Promise<void> {
  if (workerReady) {
    return;
  }
  const { version } = await import("pdfjs-dist/package.json");
  pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${version}/build/pdf.worker.min.mjs`;
  workerReady = true;
}

export { pdfjs };
