import { extname } from "node:path";
import { convertWithLibreOffice } from "./libreoffice.js";

const WORD_EXTENSIONS = new Set([".doc", ".docx"]);

export async function convertWordToPdf(
  inputPath: string,
  outputDir: string,
  onStage?: (label: string) => void,
): Promise<string> {
  const ext = extname(inputPath).toLowerCase();
  if (!WORD_EXTENSIONS.has(ext)) {
    throw new Error("Only Word documents (.doc, .docx) are supported.");
  }

  onStage?.("Converting to PDF with LibreOffice…");
  return convertWithLibreOffice(inputPath, outputDir, {
    outputFormat: "pdf",
    expectedExt: ".pdf",
  });
}
