import { createWorker, type Worker } from "tesseract.js";

let sharedWorker: Worker | null = null;

async function getWorker(): Promise<Worker> {
  if (!sharedWorker) {
    const languages = (process.env.OCR_LANGUAGES ?? "eng").split(",").join("+");
    sharedWorker = await createWorker(languages);
  }
  return sharedWorker;
}

export async function terminateOcrWorker(): Promise<void> {
  if (sharedWorker) {
    await sharedWorker.terminate();
    sharedWorker = null;
  }
}

export async function ocrPageImage(image: Buffer): Promise<string> {
  const worker = await getWorker();
  const { data } = await worker.recognize(image);
  return data.text.trim();
}
