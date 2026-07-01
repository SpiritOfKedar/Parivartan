import { degrees, type PDFDocument, type Rotation } from "pdf-lib";
import { loadPdfDocument, savePdfDocument } from "./pdf-io";

export type RotationAngle = 0 | 90 | 180 | 270;

function toRotation(angle: RotationAngle): Rotation {
  return degrees(angle);
}

function currentAngle(page: ReturnType<PDFDocument["getPages"]>[number]): RotationAngle {
  const rotation = page.getRotation().angle;
  const normalized = ((rotation % 360) + 360) % 360;
  if (normalized === 90) return 90;
  if (normalized === 180) return 180;
  if (normalized === 270) return 270;
  return 0;
}

export async function rotatePdfPages(
  file: File,
  rotations: RotationAngle[],
): Promise<Uint8Array> {
  const doc = await loadPdfDocument(file);
  const pages = doc.getPages();

  pages.forEach((page, index) => {
    const angle = rotations[index] ?? 0;
    const existing = currentAngle(page);
    const combined = ((existing + angle) % 360) as RotationAngle;
    page.setRotation(toRotation(combined));
  });

  return savePdfDocument(doc);
}

export async function rotateAllPdfPages(
  file: File,
  angle: RotationAngle,
): Promise<Uint8Array> {
  const doc = await loadPdfDocument(file);
  for (const page of doc.getPages()) {
    const existing = currentAngle(page);
    const combined = ((existing + angle) % 360) as RotationAngle;
    page.setRotation(toRotation(combined));
  }
  return savePdfDocument(doc);
}
