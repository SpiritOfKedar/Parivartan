import { readFile, writeFile } from "node:fs/promises";
import { basename, extname, join } from "node:path";
import {
  getConversionEngine,
  type ConversionEngine,
  type ConversionOptions,
} from "@convert-hub/conversion-engine";

export async function runEngineConversion(
  inputPath: string,
  outputDir: string,
  outputExt: string,
  convert: (
    engine: ConversionEngine,
    input: Buffer,
    options: ConversionOptions,
  ) => Promise<Buffer>,
  onStage?: ConversionOptions["onStage"],
): Promise<string> {
  const input = await readFile(inputPath);
  const engine = getConversionEngine();
  const output = await convert(engine, input, { onStage });
  const stem = basename(inputPath, extname(inputPath));
  const outputPath = join(outputDir, `${stem}${outputExt}`);
  await writeFile(outputPath, output);
  return outputPath;
}
