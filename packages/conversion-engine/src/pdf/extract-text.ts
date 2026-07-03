import type { PDFDocumentProxy } from "pdfjs-dist";
import { loadPdfDocument } from "./pdfjs-node.js";
import { ocrPageImage } from "./ocr-page.js";
import { renderPageToJpeg } from "./pdfjs-node.js";

const MIN_PAGE_TEXT_CHARS = 40;

export interface PageText {
  pageNumber: number;
  text: string;
  usedOcr: boolean;
}

interface PdfTextItem {
  str: string;
  transform: number[];
}

function isTextItem(item: unknown): item is PdfTextItem {
  return (
    typeof item === "object" &&
    item !== null &&
    "str" in item &&
    "transform" in item
  );
}

function groupTextItemsIntoLines(items: PdfTextItem[]): string[] {
  const buckets = new Map<number, { x: number; text: string }[]>();

  for (const item of items) {
    if (!item.str.trim()) {
      continue;
    }
    const y = Math.round(item.transform[5] ?? 0);
    const x = item.transform[4] ?? 0;
    const row = buckets.get(y) ?? [];
    row.push({ x, text: item.str });
    buckets.set(y, row);
  }

  const sortedYs = [...buckets.keys()].sort((a, b) => b - a);
  const lines: string[] = [];

  for (const y of sortedYs) {
    const parts = (buckets.get(y) ?? []).sort((a, b) => a.x - b.x);
    const line = parts.map((part) => part.text).join(" ").replace(/\s+/g, " ").trim();
    if (line) {
      lines.push(line);
    }
  }

  return lines;
}

async function extractPageText(
  pdf: PDFDocumentProxy,
  pageNumber: number,
  onStage?: (label: string) => void,
): Promise<PageText> {
  const page = await pdf.getPage(pageNumber);
  const content = await page.getTextContent();
  const items = content.items.filter(isTextItem) as PdfTextItem[];
  const lines = groupTextItemsIntoLines(items);
  let text = lines.join("\n").trim();
  let usedOcr = false;

  if (text.replace(/\s+/g, "").length < MIN_PAGE_TEXT_CHARS) {
    onStage?.(`Running OCR on page ${pageNumber}…`);
    const jpeg = await renderPageToJpeg(page);
    text = await ocrPageImage(jpeg);
    usedOcr = true;
  }

  return { pageNumber, text, usedOcr };
}

export async function extractAllPageTexts(
  input: Buffer,
  onStage?: (label: string) => void,
): Promise<PageText[]> {
  const pdf = await loadPdfDocument(input);
  const pages: PageText[] = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum += 1) {
    onStage?.(`Extracting text from page ${pageNum} of ${pdf.numPages}…`);
    pages.push(await extractPageText(pdf, pageNum, onStage));
  }

  return pages;
}

export async function loadPdfPageCount(input: Buffer): Promise<number> {
  const pdf = await loadPdfDocument(input);
  return pdf.numPages;
}
