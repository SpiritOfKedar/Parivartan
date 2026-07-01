import { convertWithLibreOffice } from "./libreoffice.js";
import { prepareSearchablePdf } from "./ocr-pdf.js";

export async function convertPdfToPptx(
  inputPath: string,
  outputDir: string,
  workDir: string,
  onStage?: (label: string) => void,
): Promise<string> {
  onStage?.("Checking whether OCR is needed…");
  const prepared = await prepareSearchablePdf(inputPath, workDir);

  if (prepared.usedOcr) {
    onStage?.("Running OCR on scanned pages…");
  }

  onStage?.("Converting to PowerPoint with LibreOffice…");
  return convertWithLibreOffice(prepared.inputPath, outputDir, {
    infilter: "impress_pdf_import",
    outputFormat: "pptx",
    expectedExt: ".pptx",
  });
}
