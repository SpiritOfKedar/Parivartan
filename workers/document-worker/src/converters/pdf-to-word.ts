import { runEngineConversion } from "./engine-helpers.js";

export async function convertPdfToDocx(
  inputPath: string,
  outputDir: string,
  _workDir: string,
  onStage?: (label: string) => void,
): Promise<string> {
  return runEngineConversion(
    inputPath,
    outputDir,
    ".docx",
    (engine, input, options) => engine.pdfToDocx(input, options),
    onStage,
  );
}
