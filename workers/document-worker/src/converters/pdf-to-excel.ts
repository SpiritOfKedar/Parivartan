import { join } from "node:path";
import ExcelJS from "exceljs";
import { runCommand } from "../lib/shell.js";
import { prepareSearchablePdf } from "./ocr-pdf.js";

function parseLayoutLine(line: string): string[] {
  const trimmed = line.trimEnd();
  if (!trimmed.trim()) {
    return [];
  }

  const tabSplit = trimmed.split("\t").filter((cell) => cell.length > 0);
  if (tabSplit.length > 1) {
    return tabSplit.map((cell) => cell.trim());
  }

  const columns = trimmed.split(/\s{2,}/).map((cell) => cell.trim());
  return columns.length > 0 ? columns : [trimmed.trim()];
}

function sanitizeSheetName(name: string, used: Set<string>): string {
  const base = name.replace(/[\\/*?:[\]]/g, "_").slice(0, 31) || "Sheet";
  let candidate = base;
  let counter = 2;
  while (used.has(candidate)) {
    const suffix = ` ${counter}`;
    candidate = `${base.slice(0, 31 - suffix.length)}${suffix}`;
    counter += 1;
  }
  used.add(candidate);
  return candidate;
}

async function extractLayoutText(pdfPath: string): Promise<string> {
  const { stdout } = await runCommand("pdftotext", ["-layout", pdfPath, "-"]);
  return stdout;
}

function hasMeaningfulContent(rows: string[][]): boolean {
  return rows.some((row) => row.some((cell) => cell.replace(/\s+/g, "").length > 0));
}

export async function convertPdfToExcel(
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

  onStage?.("Extracting text from PDF…");
  const layoutText = await extractLayoutText(prepared.inputPath);
  const pages = layoutText.split("\f");
  const workbook = new ExcelJS.Workbook();
  const usedSheetNames = new Set<string>();
  let sheetsAdded = 0;

  for (let pageIndex = 0; pageIndex < pages.length; pageIndex += 1) {
    const pageText = pages[pageIndex] ?? "";
    const lines = pageText.split("\n");
    const rows: string[][] = [];

    for (const line of lines) {
      const cells = parseLayoutLine(line);
      if (cells.length > 0) {
        rows.push(cells);
      }
    }

    if (!hasMeaningfulContent(rows)) {
      continue;
    }

    const sheetName = sanitizeSheetName(`Page ${pageIndex + 1}`, usedSheetNames);
    const sheet = workbook.addWorksheet(sheetName);
    for (const row of rows) {
      sheet.addRow(row);
    }
    sheetsAdded += 1;
  }

  if (sheetsAdded === 0) {
    throw new Error(
      "Could not extract table data from this PDF. Try a PDF with selectable text or tables.",
    );
  }

  onStage?.("Building Excel workbook…");
  const outputPath = join(outputDir, "converted.xlsx");
  await workbook.xlsx.writeFile(outputPath);
  return outputPath;
}
