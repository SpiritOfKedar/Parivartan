import { PDFDocument } from "pdf-lib";
import JSZip from "jszip";

export type SplitMode = "each-page" | "ranges" | "extract";

export interface SplitPdfPart {
  name: string;
  bytes: Uint8Array;
}

export function baseName(fileName: string): string {
  const dot = fileName.lastIndexOf(".");
  return dot > 0 ? fileName.slice(0, dot) : fileName;
}

export async function getPdfPageCount(file: File): Promise<number> {
  const bytes = await file.arrayBuffer();
  const pdf = await PDFDocument.load(bytes, { ignoreEncryption: false });
  return pdf.getPageCount();
}

export function parsePageRanges(
  input: string,
  pageCount: number,
): number[][] | null {
  const trimmed = input.trim();
  if (!trimmed) {
    return null;
  }

  const groups: number[][] = [];
  const parts = trimmed.split(",").map((part) => part.trim());

  for (const part of parts) {
    if (!part) {
      continue;
    }

    const rangeMatch = /^(\d+)\s*-\s*(\d+)$/.exec(part);
    if (rangeMatch) {
      const start = Number(rangeMatch[1]);
      const end = Number(rangeMatch[2]);
      if (
        !Number.isInteger(start) ||
        !Number.isInteger(end) ||
        start < 1 ||
        end < start ||
        end > pageCount
      ) {
        return null;
      }
      const indices: number[] = [];
      for (let page = start; page <= end; page++) {
        indices.push(page - 1);
      }
      groups.push(indices);
      continue;
    }

    const page = Number(part);
    if (!Number.isInteger(page) || page < 1 || page > pageCount) {
      return null;
    }
    groups.push([page - 1]);
  }

  return groups.length > 0 ? groups : null;
}

async function buildPdfFromPages(
  source: PDFDocument,
  pageIndices: number[],
): Promise<Uint8Array> {
  const output = await PDFDocument.create();
  const pages = await output.copyPages(source, pageIndices);
  for (const page of pages) {
    output.addPage(page);
  }
  return output.save();
}

function formatPageLabel(indices: number[]): string {
  if (indices.length === 1) {
    return `page-${indices[0]! + 1}`;
  }
  return `pages-${indices[0]! + 1}-${indices[indices.length - 1]! + 1}`;
}

export async function splitPdf(
  file: File,
  mode: SplitMode,
  rangeInput: string,
): Promise<SplitPdfPart[]> {
  const input = new Uint8Array(await file.arrayBuffer());
  const source = await PDFDocument.load(input, { ignoreEncryption: false });
  const pageCount = source.getPageCount();
  const stem = baseName(file.name);
  const results: SplitPdfPart[] = [];

  if (mode === "each-page") {
    for (let i = 0; i < pageCount; i++) {
      const bytes = await buildPdfFromPages(source, [i]);
      results.push({
        name: `${stem}-page-${i + 1}.pdf`,
        bytes,
      });
    }
    return results;
  }

  const groups = parsePageRanges(rangeInput, pageCount);
  if (!groups) {
    throw new Error("Invalid page selection. Use formats like 1, 3-5, 8.");
  }

  if (mode === "extract") {
    const indices = groups.flat();
    const uniqueSorted = [...new Set(indices)].sort((a, b) => a - b);
    const bytes = await buildPdfFromPages(source, uniqueSorted);
    const label =
      uniqueSorted.length === 1
        ? `page-${uniqueSorted[0]! + 1}`
        : `pages-${uniqueSorted.map((index) => index + 1).join("-")}`;
    return [{ name: `${stem}-${label}.pdf`, bytes }];
  }

  for (let i = 0; i < groups.length; i++) {
    const indices = groups[i]!;
    const bytes = await buildPdfFromPages(source, indices);
    results.push({
      name: `${stem}-${formatPageLabel(indices)}.pdf`,
      bytes,
    });
  }

  return results;
}

export async function zipSplitParts(parts: SplitPdfPart[]): Promise<Blob> {
  const zip = new JSZip();
  for (const part of parts) {
    zip.file(part.name, part.bytes);
  }
  return zip.generateAsync({ type: "blob" });
}
