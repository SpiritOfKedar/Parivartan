import {
  AlignmentType,
  BorderStyle,
  Document,
  ImageRun,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx";
import type { PDFPageProxy } from "pdfjs-dist";
import type { TextItem } from "pdfjs-dist/types/src/display/api";
import { ensurePdfWorker, pdfjs } from "./pdfjs";
import { baseName } from "./split-pdf";

export type PdfToWordMode = "auto" | "text" | "visual";

export interface PdfToWordProgress {
  current: number;
  total: number;
  label: string;
}

type DocxBlock = Paragraph | Table;

interface TextLine {
  y: number;
  height: number;
  items: TextItem[];
}

interface StyleContext {
  styles: Record<string, { fontFamily?: string }>;
  pageWidth: number;
}

const LINE_Y_THRESHOLD = 4;
const COLUMN_GAP = 18;
const COLUMN_ALIGN_TOLERANCE = 28;
const PARAGRAPH_GAP_MULTIPLIER = 1.6;
const MIN_TABLE_ROWS = 2;
const MIN_TABLE_COLS = 2;
const MIN_TEXT_CHARS_FOR_TEXT_MODE = 40;
const VISUAL_RENDER_SCALE = 2;

function isTextItem(item: unknown): item is TextItem {
  return (
    typeof item === "object" &&
    item !== null &&
    "str" in item &&
    typeof (item as TextItem).str === "string"
  );
}

function itemX(item: TextItem): number {
  return item.transform[4]!;
}

function itemY(item: TextItem): number {
  return item.transform[5]!;
}

function itemHeight(item: TextItem): number {
  return Math.abs(item.transform[3]!);
}

function groupItemsIntoLines(items: TextItem[]): TextLine[] {
  const lines: TextLine[] = [];

  for (const item of items) {
    if (!item.str.trim()) {
      continue;
    }

    const y = itemY(item);
    const existing = lines.find((line) => Math.abs(line.y - y) < LINE_Y_THRESHOLD);
    if (existing) {
      existing.items.push(item);
      existing.height = Math.max(existing.height, itemHeight(item));
    } else {
      lines.push({ y, height: itemHeight(item), items: [item] });
    }
  }

  return lines
    .map((line) => ({
      ...line,
      items: [...line.items].sort((a, b) => itemX(a) - itemX(b)),
    }))
    .sort((a, b) => b.y - a.y);
}

function getColumnAnchors(items: TextItem[]): number[] {
  const anchors: number[] = [];
  for (const item of items) {
    const x = itemX(item);
    const existing = anchors.find((anchor) => Math.abs(anchor - x) < COLUMN_GAP);
    if (existing === undefined) {
      anchors.push(x);
    }
  }
  return anchors.sort((a, b) => a - b);
}

function assignItemsToColumns(items: TextItem[], anchors: number[]): string[] {
  const cells = anchors.map(() => "");
  for (const item of items) {
    let bestIndex = 0;
    let bestDistance = Number.POSITIVE_INFINITY;
    for (let index = 0; index < anchors.length; index++) {
      const distance = Math.abs(itemX(item) - anchors[index]!);
      if (distance < bestDistance) {
        bestDistance = distance;
        bestIndex = index;
      }
    }
    cells[bestIndex] = cells[bestIndex]
      ? `${cells[bestIndex]} ${item.str}`.trim()
      : item.str.trim();
  }
  return cells;
}

function anchorsAlign(a: number[], b: number[]): boolean {
  if (a.length !== b.length || a.length < MIN_TABLE_COLS) {
    return false;
  }
  return a.every((anchor, index) => Math.abs(anchor - b[index]!) < COLUMN_ALIGN_TOLERANCE);
}

function detectTableBlock(lines: TextLine[], start: number): { rows: string[][]; length: number } | null {
  if (start >= lines.length) {
    return null;
  }

  const firstAnchors = getColumnAnchors(lines[start]!.items);
  if (firstAnchors.length < MIN_TABLE_COLS) {
    return null;
  }

  const rows: string[][] = [assignItemsToColumns(lines[start]!.items, firstAnchors)];
  let index = start + 1;

  while (index < lines.length) {
    const anchors = getColumnAnchors(lines[index]!.items);
    if (!anchorsAlign(firstAnchors, anchors)) {
      break;
    }
    rows.push(assignItemsToColumns(lines[index]!.items, firstAnchors));
    index++;
  }

  if (rows.length < MIN_TABLE_ROWS) {
    return null;
  }

  return { rows, length: index - start };
}

function styleForItem(
  item: TextItem,
  styles: Record<string, { fontFamily?: string }>,
): { bold: boolean; italics: boolean; size: number; font: string } {
  const fontName = (item.fontName ?? "").toLowerCase();
  const style = styles[item.fontName];
  const fontFamily = (style?.fontFamily ?? "").toLowerCase();

  let font = "Calibri";
  if (style?.fontFamily) {
    const match = style.fontFamily.match(/([^,]+)/);
    if (match?.[1]) {
      font = match[1].replace(/['"]/g, "").trim();
    }
  }

  return {
    bold:
      fontName.includes("bold") ||
      fontName.includes("black") ||
      fontName.includes("semibold") ||
      fontFamily.includes("bold"),
    italics:
      fontName.includes("italic") ||
      fontName.includes("oblique") ||
      fontFamily.includes("italic"),
    size: Math.max(16, Math.min(120, Math.round(itemHeight(item) * 2))),
    font,
  };
}

function buildTextRuns(line: TextLine, styles: Record<string, { fontFamily?: string }>): TextRun[] {
  const runs: TextRun[] = [];
  let current = "";
  let currentStyle = styleForItem(line.items[0] ?? { str: "", transform: [0, 0, 12, 0, 0, 0] } as TextItem, styles);

  function flush() {
    if (!current) {
      return;
    }
    runs.push(
      new TextRun({
        text: current,
        bold: currentStyle.bold,
        italics: currentStyle.italics,
        size: currentStyle.size,
        font: currentStyle.font,
      }),
    );
    current = "";
  }

  for (let index = 0; index < line.items.length; index++) {
    const item = line.items[index]!;
    const nextStyle = styleForItem(item, styles);

    if (index > 0) {
      const previous = line.items[index - 1]!;
      const gap = itemX(item) - (itemX(previous) + (previous.width ?? 0));
      const charWidth =
        (previous.width ?? itemHeight(previous)) / Math.max(previous.str.length, 1);
      const sameStyle =
        nextStyle.bold === currentStyle.bold &&
        nextStyle.italics === currentStyle.italics &&
        Math.abs(nextStyle.size - currentStyle.size) <= 2 &&
        nextStyle.font === currentStyle.font;

      if (!sameStyle) {
        flush();
        currentStyle = nextStyle;
        current = item.str;
        continue;
      }

      if (gap > charWidth * 1.8) {
        flush();
        current = item.str;
        continue;
      }

      if (gap > charWidth * 0.35 && !current.endsWith(" ") && !item.str.startsWith(" ")) {
        current += " ";
      }
    }

    current = index === 0 ? item.str : current + item.str;
    currentStyle = nextStyle;
  }

  flush();
  return runs;
}

function detectAlignment(line: TextLine, pageWidth: number): (typeof AlignmentType)[keyof typeof AlignmentType] {
  const sorted = line.items;
  const minX = itemX(sorted[0]!);
  const last = sorted[sorted.length - 1]!;
  const maxX = itemX(last) + (last.width ?? 0);
  const lineWidth = maxX - minX;
  const lineCenter = minX + lineWidth / 2;
  const pageCenter = pageWidth / 2;

  if (lineWidth > 0 && lineWidth < pageWidth * 0.85) {
    if (minX > pageWidth * 0.12 && Math.abs(lineCenter - pageCenter) < 45) {
      return AlignmentType.CENTER;
    }
    if (Math.abs(maxX - (pageWidth - 48)) < 36) {
      return AlignmentType.RIGHT;
    }
  }

  return AlignmentType.LEFT;
}

function buildParagraph(line: TextLine, context: StyleContext): Paragraph | null {
  const children = buildTextRuns(line, context.styles);
  if (children.length === 0) {
    return null;
  }

  return new Paragraph({
    alignment: detectAlignment(line, context.pageWidth),
    children,
    spacing: { after: 80, line: 276 },
  });
}

function buildTable(rows: string[][]): Table {
  const columnCount = Math.max(...rows.map((row) => row.length));

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: rows.map(
      (row) =>
        new TableRow({
          children: Array.from({ length: columnCount }, (_, index) => {
            const text = row[index]?.trim() ?? "";
            return new TableCell({
              width: {
                size: Math.floor(100 / columnCount),
                type: WidthType.PERCENTAGE,
              },
              borders: {
                top: { style: BorderStyle.SINGLE, size: 1, color: "BFBFBF" },
                bottom: { style: BorderStyle.SINGLE, size: 1, color: "BFBFBF" },
                left: { style: BorderStyle.SINGLE, size: 1, color: "BFBFBF" },
                right: { style: BorderStyle.SINGLE, size: 1, color: "BFBFBF" },
              },
              children: [
                new Paragraph({
                  children: [new TextRun({ text, font: "Calibri", size: 20 })],
                  spacing: { before: 40, after: 40 },
                }),
              ],
            });
          }),
        }),
    ),
  });
}

function medianLineHeight(lines: TextLine[]): number {
  if (lines.length === 0) {
    return 12;
  }
  const heights = lines.map((line) => line.height).sort((a, b) => a - b);
  return heights[Math.floor(heights.length / 2)] ?? 12;
}

function linesToBlocks(lines: TextLine[], context: StyleContext): DocxBlock[] {
  const blocks: DocxBlock[] = [];
  const paragraphGap = medianLineHeight(lines) * PARAGRAPH_GAP_MULTIPLIER;
  let index = 0;

  while (index < lines.length) {
    const table = detectTableBlock(lines, index);
    if (table) {
      blocks.push(buildTable(table.rows));
      blocks.push(new Paragraph({ spacing: { after: 120 } }));
      index += table.length;
      continue;
    }

    const paragraph = buildParagraph(lines[index]!, context);
    if (paragraph) {
      blocks.push(paragraph);
    }
    index++;

    while (index < lines.length) {
      const nextTable = detectTableBlock(lines, index);
      if (nextTable) {
        break;
      }
      const gap = lines[index - 1]!.y - lines[index]!.y;
      if (gap > paragraphGap) {
        break;
      }
      const nextParagraph = buildParagraph(lines[index]!, context);
      if (nextParagraph) {
        blocks.push(nextParagraph);
      }
      index++;
    }

    blocks.push(new Paragraph({ spacing: { after: 120 } }));
  }

  return blocks;
}

async function pageToImageParagraph(page: PDFPageProxy): Promise<Paragraph> {
  const viewport = page.getViewport({ scale: VISUAL_RENDER_SCALE });
  const canvas = document.createElement("canvas");
  canvas.width = Math.floor(viewport.width);
  canvas.height = Math.floor(viewport.height);
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Could not create canvas context.");
  }

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  await page.render({ canvasContext: context, viewport, canvas }).promise;

  const pngBytes = await new Promise<Uint8Array>((resolve, reject) => {
    canvas.toBlob(async (blob) => {
      if (!blob) {
        reject(new Error("Failed to render page image."));
        return;
      }
      resolve(new Uint8Array(await blob.arrayBuffer()));
    }, "image/png");
  });

  const baseViewport = page.getViewport({ scale: 1 });
  const maxWidth = 620;
  const scaleFactor = maxWidth / baseViewport.width;

  return new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [
      new ImageRun({
        type: "png",
        data: pngBytes,
        transformation: {
          width: maxWidth,
          height: Math.round(baseViewport.height * scaleFactor),
        },
      }),
    ],
    spacing: { after: 200 },
  });
}

async function pageToStructuredBlocks(page: PDFPageProxy): Promise<{
  blocks: DocxBlock[];
  textLength: number;
  tableCount: number;
}> {
  const textContent = await page.getTextContent();
  const items = textContent.items.filter(isTextItem);
  const textLength = items.reduce((sum, item) => sum + item.str.trim().length, 0);
  const lines = groupItemsIntoLines(items);
  const context: StyleContext = {
    styles: textContent.styles,
    pageWidth: page.getViewport({ scale: 1 }).width,
  };

  let tableCount = 0;
  let index = 0;
  while (index < lines.length) {
    const table = detectTableBlock(lines, index);
    if (table) {
      tableCount++;
      index += table.length;
    } else {
      index++;
    }
  }

  return {
    blocks: linesToBlocks(lines, context),
    textLength,
    tableCount,
  };
}

function shouldUseVisualPage(
  mode: PdfToWordMode,
  textLength: number,
  tableCount: number,
  blockCount: number,
): boolean {
  if (mode === "visual") {
    return true;
  }
  if (mode === "text") {
    return blockCount === 0;
  }

  if (textLength < MIN_TEXT_CHARS_FOR_TEXT_MODE) {
    return true;
  }
  if (blockCount === 0) {
    return true;
  }
  if (tableCount === 0 && textLength < 120) {
    return true;
  }
  return false;
}

async function convertPage(page: PDFPageProxy, mode: PdfToWordMode): Promise<DocxBlock[]> {
  if (mode === "visual") {
    return [await pageToImageParagraph(page)];
  }

  const structured = await pageToStructuredBlocks(page);
  if (
    shouldUseVisualPage(mode, structured.textLength, structured.tableCount, structured.blocks.length)
  ) {
    return [await pageToImageParagraph(page)];
  }

  return structured.blocks;
}

export async function convertPdfToWord(
  file: File,
  mode: PdfToWordMode,
  onProgress?: (progress: PdfToWordProgress) => void,
): Promise<Blob> {
  await ensurePdfWorker();

  const input = new Uint8Array(await file.arrayBuffer());
  const pdf = await pdfjs.getDocument({ data: input }).promise;
  const total = pdf.numPages;
  const children: DocxBlock[] = [];

  for (let pageNumber = 1; pageNumber <= total; pageNumber++) {
    onProgress?.({
      current: pageNumber,
      total,
      label:
        mode === "visual"
          ? `Rendering page ${pageNumber} of ${total}…`
          : `Rebuilding page ${pageNumber} of ${total}…`,
    });

    const page = await pdf.getPage(pageNumber);
    const pageBlocks = await convertPage(page, mode);
    children.push(...pageBlocks);

    if (pageNumber < total) {
      children.push(
        new Paragraph({
          children: [new TextRun({ break: 1 })],
          spacing: { after: 120 },
        }),
      );
    }
  }

  onProgress?.({
    current: total,
    total,
    label: "Building Word document…",
  });

  const document = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 720,
              right: 720,
              bottom: 720,
              left: 720,
            },
          },
        },
        children: children.length > 0 ? children : [new Paragraph("")],
      },
    ],
  });

  return Packer.toBlob(document);
}

export function wordOutputName(fileName: string): string {
  return `${baseName(fileName)}.docx`;
}
