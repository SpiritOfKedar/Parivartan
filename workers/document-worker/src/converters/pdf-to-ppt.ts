import { runEngineConversion } from "./engine-helpers.js";

export async function convertPdfToPptx(
  inputPath: string,
  outputDir: string,
  _workDir: string,
  onStage?: (label: string) => void,
): Promise<string> {
  return runEngineConversion(
    inputPath,
    outputDir,
    ".pptx",
    (engine, input, options) => engine.pdfToPptx(input, options),
    onStage,
  );
}
