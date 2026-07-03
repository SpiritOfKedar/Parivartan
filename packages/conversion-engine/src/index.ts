import { docxToPdf } from "./docx-to-pdf.js";
import { pdfToDocx } from "./pdf-to-docx.js";
import { pdfToPptx } from "./pdf-to-pptx.js";
import { pdfToXlsx } from "./pdf-to-xlsx.js";
import type { ConversionEngine, ConversionOptions } from "./types.js";

export class NodeConversionEngine implements ConversionEngine {
  pdfToDocx(input: Buffer, options?: ConversionOptions): Promise<Buffer> {
    return pdfToDocx(input, options);
  }

  pdfToPptx(input: Buffer, options?: ConversionOptions): Promise<Buffer> {
    return pdfToPptx(input, options);
  }

  pdfToXlsx(input: Buffer, options?: ConversionOptions): Promise<Buffer> {
    return pdfToXlsx(input, options);
  }

  docxToPdf(input: Buffer, options?: ConversionOptions): Promise<Buffer> {
    return docxToPdf(input, options);
  }
}

let defaultEngine: ConversionEngine | null = null;

export function getConversionEngine(): ConversionEngine {
  const engineType = process.env.CONVERSION_ENGINE ?? "node";
  if (engineType !== "node") {
    throw new Error(`Unsupported CONVERSION_ENGINE: ${engineType}`);
  }

  if (!defaultEngine) {
    defaultEngine = new NodeConversionEngine();
  }
  return defaultEngine;
}

export { docxToPdf } from "./docx-to-pdf.js";
export { pdfToDocx } from "./pdf-to-docx.js";
export { pdfToPptx } from "./pdf-to-pptx.js";
export { pdfToXlsx } from "./pdf-to-xlsx.js";
export { terminateOcrWorker } from "./pdf/ocr-page.js";
export type { ConversionEngine, ConversionOptions } from "./types.js";
