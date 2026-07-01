import { encryptPDF } from "@pdfsmaller/pdf-encrypt";
import { loadPdfDocument } from "./pdf-io";

export async function protectPdfWithPassword(
  file: File,
  password: string,
): Promise<Uint8Array> {
  const doc = await loadPdfDocument(file);
  const pdfBytes = await doc.save({ useObjectStreams: true });
  return encryptPDF(pdfBytes, password);
}
