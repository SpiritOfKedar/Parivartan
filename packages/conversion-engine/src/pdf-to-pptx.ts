import PptxGenJSImport from "pptxgenjs";
import { loadPdfDocument, renderPageToJpeg } from "./pdf/pdfjs-node.js";
import type { ConversionOptions } from "./types.js";

type PptxConstructor = new () => {
  layout: string;
  addSlide(): {
    addImage: (opts: {
      data: string;
      x: number | string;
      y: number | string;
      w: number | string;
      h: number | string;
    }) => void;
  };
  write: (opts: { outputType: "nodebuffer" }) => Promise<Buffer | ArrayBuffer | Uint8Array>;
};

export async function pdfToPptx(
  input: Buffer,
  options: ConversionOptions = {},
): Promise<Buffer> {
  options.onStage?.("Reading PDF…");
  const pdf = await loadPdfDocument(input);
  const PptxGenJS = PptxGenJSImport as unknown as PptxConstructor;
  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_16x9";

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum += 1) {
    options.onStage?.(`Rendering slide ${pageNum} of ${pdf.numPages}…`);
    const page = await pdf.getPage(pageNum);
    const jpeg = await renderPageToJpeg(page, 2, 0.9);
    const slide = pptx.addSlide();
    slide.addImage({
      data: `image/jpeg;base64,${jpeg.toString("base64")}`,
      x: 0,
      y: 0,
      w: "100%",
      h: "100%",
    });
  }

  options.onStage?.("Building PowerPoint file…");
  const output = (await pptx.write({ outputType: "nodebuffer" })) as Buffer;
  return Buffer.from(output);
}
