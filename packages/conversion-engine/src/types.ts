export interface ConversionStageCallback {
  (label: string): void;
}

export interface ConversionOptions {
  onStage?: ConversionStageCallback;
}

export interface ConversionEngine {
  pdfToDocx(input: Buffer, options?: ConversionOptions): Promise<Buffer>;
  pdfToPptx(input: Buffer, options?: ConversionOptions): Promise<Buffer>;
  pdfToXlsx(input: Buffer, options?: ConversionOptions): Promise<Buffer>;
  docxToPdf(input: Buffer, options?: ConversionOptions): Promise<Buffer>;
}
