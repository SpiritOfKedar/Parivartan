import { runEngineConversion } from "./engine-helpers.js";

export async function convertPdfToExcel(
  inputPath: string,
  outputDir: string,
  _workDir: string,
  onStage?: (label: string) => void,
): Promise<string> {
  return runEngineConversion(
    inputPath,
    outputDir,
    ".xlsx",
    (engine, input, options) => engine.pdfToXlsx(input, options),
    onStage,
  );
}
