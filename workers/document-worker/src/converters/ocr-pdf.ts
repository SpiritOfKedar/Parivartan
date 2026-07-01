import { join } from "node:path";
import { findBinary, runCommand } from "../lib/shell.js";

const MIN_TEXT_CHARS = 40;

export interface OcrPrepareResult {
  inputPath: string;
  usedOcr: boolean;
}

async function getExtractableTextLength(pdfPath: string): Promise<number> {
  try {
    const { stdout } = await runCommand("pdftotext", [pdfPath, "-"]);
    return stdout.replace(/\s+/g, "").length;
  } catch {
    return 0;
  }
}

export async function isScannedPdf(pdfPath: string): Promise<boolean> {
  const textLength = await getExtractableTextLength(pdfPath);
  return textLength < MIN_TEXT_CHARS;
}

export async function prepareSearchablePdf(
  inputPath: string,
  workDir: string,
): Promise<OcrPrepareResult> {
  const scanned = await isScannedPdf(inputPath);
  if (!scanned) {
    return { inputPath, usedOcr: false };
  }

  const ocrmypdf = await findBinary(["ocrmypdf"]);
  if (!ocrmypdf) {
    throw new Error(
      "This PDF looks scanned (image-only). Install ocrmypdf and tesseract on the server to enable OCR, then try again.",
    );
  }

  const ocrOutputPath = join(workDir, "ocr-searchable.pdf");
  const languages = (process.env.OCR_LANGUAGES ?? "eng").split(",").join("+");

  await runCommand(ocrmypdf, [
    "--skip-text",
    "--language",
    languages,
    "--optimize",
    "1",
    "--jobs",
    process.env.OCR_JOBS ?? "2",
    inputPath,
    ocrOutputPath,
  ]);

  return { inputPath: ocrOutputPath, usedOcr: true };
}
