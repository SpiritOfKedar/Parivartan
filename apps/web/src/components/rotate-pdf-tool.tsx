"use client";

import { useRef, useState } from "react";
import { downloadBlob } from "../lib/merge-pdf";
import { baseName, formatFileSize, isPdf, loadPdfDocument } from "../lib/pdf-io";
import { rotateAllPdfPages, type RotationAngle } from "../lib/rotate-pdf";
import { PdfToolShell } from "./pdf-tool-shell";
import { useTranslations } from "../lib/i18n/locale-provider";

type Phase = "idle" | "processing" | "done" | "error";

const ROTATION_OPTIONS: { label: string; angle: RotationAngle }[] = [
  { label: "90° clockwise", angle: 90 },
  { label: "180°", angle: 180 },
  { label: "90° counter-clockwise", angle: 270 },
];

export function RotatePdfTool() {
  const messages = useTranslations();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [angle, setAngle] = useState<RotationAngle>(90);
  const [dragging, setDragging] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);

  async function selectFile(incoming: File) {
    if (!isPdf(incoming)) {
      setError(messages.ui.onlyPdfAccepted);
      setPhase("error");
      return;
    }
    try {
      const doc = await loadPdfDocument(incoming);
      setFile(incoming);
      setPageCount(doc.getPageCount());
      setResultBlob(null);
      setError(null);
      setPhase("idle");
    } catch {
      setError(messages.ui.couldNotReadPdfProtected);
      setPhase("error");
    }
  }

  async function handleRotate() {
    if (!file) return;
    setPhase("processing");
    setError(null);
    setResultBlob(null);
    try {
      const bytes = await rotateAllPdfPages(file, angle);
      setResultBlob(new Blob([bytes.slice()], { type: "application/pdf" }));
      setPhase("done");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : messages.ui.couldNotRotatePdf);
      setPhase("error");
    }
  }

  return (
    <PdfToolShell
      inputRef={inputRef}
      dragging={dragging}
      setDragging={setDragging}
      onSelect={(f) => void selectFile(f)}
      file={file}
      onClear={() => { setFile(null); setPageCount(0); setResultBlob(null); setError(null); setPhase("idle"); if (inputRef.current) inputRef.current.value = ""; }}
      phase={phase}
      error={error}
      actionLabel={messages.ui.rotatePdf}
      processingLabel={messages.ui.rotating}
      onAction={() => void handleRotate()}
      onDownload={() => { if (resultBlob && file) downloadBlob(resultBlob, `${baseName(file.name)}-rotated.pdf`); }}
      resultReady={phase === "done" && !!resultBlob}
    >
      {file && (
        <div className="space-y-3">
          <p className="text-sm text-muted">Rotate all {pageCount} page{pageCount === 1 ? "" : "s"}</p>
          <fieldset className="flex flex-wrap gap-4 text-sm">
            {ROTATION_OPTIONS.map((opt) => (
              <label key={opt.angle} className="flex items-center gap-2">
                <input type="radio" name="rotation" checked={angle === opt.angle} onChange={() => setAngle(opt.angle)} />
                {opt.label}
              </label>
            ))}
          </fieldset>
        </div>
      )}
    </PdfToolShell>
  );
}
