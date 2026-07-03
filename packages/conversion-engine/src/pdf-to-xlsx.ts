import ExcelJS from "exceljs";
import { extractAllPageTexts } from "./pdf/extract-text.js";
import type { ConversionOptions } from "./types.js";

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

function hasMeaningfulContent(rows: string[][]): boolean {
  return rows.some((row) => row.some((cell) => cell.replace(/\s+/g, "").length > 0));
}

export async function pdfToXlsx(
  input: Buffer,
  options: ConversionOptions = {},
): Promise<Buffer> {
  options.onStage?.("Extracting text from PDF…");
  const pages = await extractAllPageTexts(input, options.onStage);
  const workbook = new ExcelJS.Workbook();
  const usedSheetNames = new Set<string>();
  let sheetsAdded = 0;

  for (const page of pages) {
    const lines = page.text.split("\n");
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

    const sheetName = sanitizeSheetName(`Page ${page.pageNumber}`, usedSheetNames);
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

  options.onStage?.("Building Excel workbook…");
  const arrayBuffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
}
