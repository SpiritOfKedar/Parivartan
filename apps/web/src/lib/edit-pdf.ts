import { rgb, StandardFonts } from "pdf-lib";
import { loadPdfDocument, savePdfDocument } from "./pdf-io";

export type TextPosition = "top" | "center" | "bottom";

export interface EditPdfTextOptions {
  text: string;
  fontSize: number;
  position: TextPosition;
  pageIndices: number[] | "all";
}

export async function addTextToPdf(
  file: File,
  options: EditPdfTextOptions,
): Promise<Uint8Array> {
  const doc = await loadPdfDocument(file);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const pages = doc.getPages();
  const content = options.text.trim();

  if (!content) {
    throw new Error("Enter text to add to the PDF.");
  }

  const targetIndices =
    options.pageIndices === "all"
      ? pages.map((_, index) => index)
      : options.pageIndices.filter((index) => index >= 0 && index < pages.length);

  if (targetIndices.length === 0) {
    throw new Error("No valid pages selected.");
  }

  for (const index of targetIndices) {
    const page = pages[index];
    if (!page) {
      continue;
    }

    const { width, height } = page.getSize();
    const textWidth = font.widthOfTextAtSize(content, options.fontSize);
    const x = (width - textWidth) / 2;
    const y =
      options.position === "top"
        ? height - 48
        : options.position === "center"
          ? height / 2
          : 48;

    page.drawText(content, {
      x,
      y,
      size: options.fontSize,
      font,
      color: rgb(0, 0, 0),
    });
  }

  return savePdfDocument(doc);
}
