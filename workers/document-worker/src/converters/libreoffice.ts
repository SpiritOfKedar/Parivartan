import { access, mkdtemp, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, extname, join } from "node:path";
import { findBinary, runCommand } from "../lib/shell.js";

export interface LibreOfficeConvertOptions {
  infilter?: string;
  outputFormat: string;
  expectedExt: string;
}

async function findConvertedFile(
  outputDir: string,
  inputPath: string,
  expectedExt: string,
): Promise<string> {
  const stem = basename(inputPath, extname(inputPath));
  const expected = join(outputDir, `${stem}${expectedExt}`);

  try {
    await access(expected);
    return expected;
  } catch {
    const files = await readdir(outputDir);
    const match = files.find((file) =>
      file.toLowerCase().endsWith(expectedExt.toLowerCase()),
    );
    if (!match) {
      throw new Error(
        `LibreOffice did not produce a ${expectedExt} file.`,
      );
    }
    return join(outputDir, match);
  }
}

export async function convertWithLibreOffice(
  inputPath: string,
  outputDir: string,
  options: LibreOfficeConvertOptions,
): Promise<string> {
  const binary = await findBinary(["soffice", "libreoffice"]);
  if (!binary) {
    throw new Error(
      "LibreOffice is not installed on the server. Install the libreoffice package.",
    );
  }

  const profileDir = await mkdtemp(join(tmpdir(), "convert-hub-lo-profile-"));
  const userInstallation = `file://${profileDir}`;

  const args = [
    "--headless",
    "--nologo",
    "--nofirststartwizard",
    `-env:UserInstallation=${userInstallation}`,
  ];

  if (options.infilter) {
    args.push(`--infilter=${options.infilter}`);
  }

  args.push(
    "--convert-to",
    options.outputFormat,
    "--outdir",
    outputDir,
    inputPath,
  );

  try {
    const { stderr } = await runCommand(binary, args);

    if (stderr.toLowerCase().includes("error:")) {
      throw new Error(stderr.trim());
    }

    return findConvertedFile(outputDir, inputPath, options.expectedExt);
  } catch (error) {
    if (error instanceof Error && error.message.includes("no export filter")) {
      throw new Error(
        "LibreOffice could not convert this file. It may be encrypted or unsupported.",
      );
    }
    throw error;
  } finally {
    await rm(profileDir, { recursive: true, force: true });
  }
}
