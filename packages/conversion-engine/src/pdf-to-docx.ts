import {
  Document,
  HeadingLevel,
  Packer,
  PageBreak,
  Paragraph,
  TextRun,
} from "docx";
import { extractAllPageTexts } from "./pdf/extract-text.js";
import type { ConversionOptions } from "./types.js";

export async function pdfToDocx(
  input: Buffer,
  options: ConversionOptions = {},
): Promise<Buffer> {
  options.onStage?.("Reading PDF…");
  const pages = await extractAllPageTexts(input, options.onStage);

  const children: Paragraph[] = [];

  for (const page of pages) {
    if (page.pageNumber > 1) {
      children.push(new Paragraph({ children: [new PageBreak()] }));
    }

    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun(`Page ${page.pageNumber}`)],
      }),
    );

    const paragraphs = page.text.split(/\n+/).filter((line: string) => line.trim());
    if (paragraphs.length === 0) {
      children.push(new Paragraph({ children: [new TextRun("(No text on this page)")] }));
    } else {
      for (const line of paragraphs) {
        children.push(new Paragraph({ children: [new TextRun(line)] }));
      }
    }
  }

  options.onStage?.("Building Word document…");
  const doc = new Document({ sections: [{ children }] });
  return Buffer.from(await Packer.toBuffer(doc));
}
