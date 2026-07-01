import { degrees, rgb, StandardFonts } from "pdf-lib";
import { loadPdfDocument, savePdfDocument } from "./pdf-io";

export interface WatermarkOptions {
  text: string;
  opacity: number;
  fontSize: number;
  angle: number;
}

export async function watermarkPdf(
  file: File,
  options: WatermarkOptions,
): Promise<Uint8Array> {
  const doc = await loadPdfDocument(file);
  const font = await doc.embedFont(StandardFonts.HelveticaBold);
  const text = options.text.trim() || "CONFIDENTIAL";

  for (const page of doc.getPages()) {
    const { width, height } = page.getSize();
    const textWidth = font.widthOfTextAtSize(text, options.fontSize);
    const x = (width - textWidth) / 2;
    const y = height / 2;

    page.drawText(text, {
      x,
      y,
      size: options.fontSize,
      font,
      color: rgb(0.4, 0.4, 0.4),
      opacity: options.opacity,
      rotate: degrees(options.angle),
    });
  }

  return savePdfDocument(doc);
}
