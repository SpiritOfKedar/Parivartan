import { rgb, StandardFonts } from "pdf-lib";
import { loadPdfDocument, savePdfDocument } from "./pdf-io";

export type PageNumberPosition = "bottom-center" | "bottom-right";

export interface PageNumberOptions {
  startAt: number;
  position: PageNumberPosition;
  fontSize: number;
}

export async function addPageNumbersToPdf(
  file: File,
  options: PageNumberOptions,
): Promise<Uint8Array> {
  const doc = await loadPdfDocument(file);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const pages = doc.getPages();

  pages.forEach((page, index) => {
    const { width } = page.getSize();
    const label = String(options.startAt + index);
    const textWidth = font.widthOfTextAtSize(label, options.fontSize);
    const margin = 36;
    const x =
      options.position === "bottom-center"
        ? (width - textWidth) / 2
        : width - margin - textWidth;

    page.drawText(label, {
      x,
      y: margin,
      size: options.fontSize,
      font,
      color: rgb(0.2, 0.2, 0.2),
    });
  });

  return savePdfDocument(doc);
}
