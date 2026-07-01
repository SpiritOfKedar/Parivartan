import type { PDFDocumentProxy } from "pdfjs-dist";
import { getPdfjs } from "./pdfjs";

const MAX_TEXT_CHARS = 120_000;

export async function extractPdfText(file: File): Promise<{
  text: string;
  pageCount: number;
  truncated: boolean;
}> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const pdfjs = await getPdfjs();
  const pdf: PDFDocumentProxy = await pdfjs.getDocument({ data: bytes }).promise;
  const parts: string[] = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum += 1) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ")
      .trim();
    if (pageText) {
      parts.push(`--- Page ${pageNum} ---\n${pageText}`);
    }
  }

  let text = parts.join("\n\n").trim();
  let truncated = false;

  if (text.replace(/\s+/g, "").length < 40) {
    throw new Error(
      "This PDF has little or no selectable text. Scanned PDFs are not supported for AI tools.",
    );
  }

  if (text.length > MAX_TEXT_CHARS) {
    text = text.slice(0, MAX_TEXT_CHARS);
    truncated = true;
  }

  return { text, pageCount: pdf.numPages, truncated };
}
