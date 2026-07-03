import { extname } from "node:path";
import { runEngineConversion } from "./engine-helpers.js";

const WORD_EXTENSIONS = new Set([".doc", ".docx"]);

export async function convertWordToPdf(
  inputPath: string,
  outputDir: string,
  _workDir: string,
  onStage?: (label: string) => void,
): Promise<string> {
  const ext = extname(inputPath).toLowerCase();
  if (!WORD_EXTENSIONS.has(ext)) {
    throw new Error("Only Word documents (.doc, .docx) are supported.");
  }

  return runEngineConversion(
    inputPath,
    outputDir,
    ".pdf",
    (engine, input, options) => engine.docxToPdf(input, options),
    onStage,
  );
}
