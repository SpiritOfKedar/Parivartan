import { access, mkdtemp, rm } from "node:fs/promises";
import { readdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, extname, join } from "node:path";
import { findBinary, runCommand } from "../lib/shell.js";
import { preparePdfForWordConversion } from "./ocr-pdf.js";

async function findConvertedDocx(
  outputDir: string,
  inputPath: string,
): Promise<string> {
  const stem = basename(inputPath, extname(inputPath));
  const expected = join(outputDir, `${stem}.docx`);

  try {
    await access(expected);
    return expected;
  } catch {
    const files = await readdir(outputDir);
    const docx = files.find((file) => file.toLowerCase().endsWith(".docx"));
    if (!docx) {
      throw new Error("LibreOffice did not produce a Word document.");
    }
    return join(outputDir, docx);
  }
}

async function convertWithLibreOffice(
  inputPath: string,
  outputDir: string,
): Promise<string> {
  const binary = await findBinary(["soffice", "libreoffice"]);
  if (!binary) {
    throw new Error(
      "LibreOffice is not installed on the server. Install the libreoffice package.",
    );
  }

  const profileDir = await mkdtemp(join(tmpdir(), "convert-hub-lo-profile-"));
  const userInstallation = `file://${profileDir}`;

  try {
    const { stderr } = await runCommand(binary, [
      "--headless",
      "--nologo",
      "--nofirststartwizard",
      `-env:UserInstallation=${userInstallation}`,
      "--infilter=writer_pdf_import",
      "--convert-to",
      "docx",
      "--outdir",
      outputDir,
      inputPath,
    ]);

    if (stderr.toLowerCase().includes("error:")) {
      throw new Error(stderr.trim());
    }

    return findConvertedDocx(outputDir, inputPath);
  } catch (error) {
    if (error instanceof Error && error.message.includes("no export filter")) {
      throw new Error(
        "LibreOffice could not convert this PDF. The file may be encrypted or unsupported.",
      );
    }
    throw error;
  } finally {
    await rm(profileDir, { recursive: true, force: true });
  }
}

export async function convertPdfToDocx(
  inputPath: string,
  outputDir: string,
  workDir: string,
  onStage?: (label: string) => void,
): Promise<string> {
  onStage?.("Checking whether OCR is needed…");
  const prepared = await preparePdfForWordConversion(inputPath, workDir);

  if (prepared.usedOcr) {
    onStage?.("Running OCR on scanned pages…");
  }

  onStage?.("Converting to Word with LibreOffice…");
  return convertWithLibreOffice(prepared.inputPath, outputDir);
}
