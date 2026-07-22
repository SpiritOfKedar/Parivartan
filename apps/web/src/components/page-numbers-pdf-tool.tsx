"use client";

import { useRef, useState } from "react";
import { downloadBlob } from "../lib/merge-pdf";
import { addPageNumbersToPdf, type PageNumberPosition } from "../lib/page-numbers-pdf";
import { baseName, formatFileSize, isPdf } from "../lib/pdf-io";
import { PdfToolShell } from "./pdf-tool-shell";
import { useTranslations } from "../lib/i18n/locale-provider";

type Phase = "idle" | "processing" | "done" | "error";

export function PageNumbersPdfTool() {
  const messages = useTranslations();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [startAt, setStartAt] = useState(1);
  const [position, setPosition] = useState<PageNumberPosition>("bottom-center");
  const [fontSize, setFontSize] = useState(12);
  const [dragging, setDragging] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);

  function selectFile(incoming: File) {
    if (!isPdf(incoming)) {
      setError(messages.ui.onlyPdfAccepted);
      setPhase("error");
      return;
    }
    setFile(incoming);
    setResultBlob(null);
    setError(null);
    setPhase("idle");
  }

  async function handleAddNumbers() {
    if (!file) return;
    setPhase("processing");
    setError(null);
    setResultBlob(null);
    try {
      const bytes = await addPageNumbersToPdf(file, { startAt, position, fontSize });
      setResultBlob(new Blob([bytes.slice()], { type: "application/pdf" }));
      setPhase("done");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : messages.ui.couldNotAddPageNumbers);
      setPhase("error");
    }
  }

  return (
    <PdfToolShell
      inputRef={inputRef}
      dragging={dragging}
      setDragging={setDragging}
      onSelect={selectFile}
      file={file}
      onClear={() => { setFile(null); setResultBlob(null); setError(null); setPhase("idle"); if (inputRef.current) inputRef.current.value = ""; }}
      phase={phase}
      error={error}
      actionLabel={messages.ui.addPageNumbers}
      processingLabel={messages.common.applying}
      onAction={() => void handleAddNumbers()}
      onDownload={() => { if (resultBlob && file) downloadBlob(resultBlob, `${baseName(file.name)}-numbered.pdf`); }}
      resultReady={phase === "done" && !!resultBlob}
    >
      {file && (
        <div className="flex flex-wrap gap-4">
          <label className="space-y-1 text-sm">
            <span className="font-medium">Start at</span>
            <input type="number" min={1} value={startAt} onChange={(e) => setStartAt(Number(e.target.value))} className="block w-20 rounded border border-border px-2 py-1" />
          </label>
          <label className="space-y-1 text-sm">
            <span className="font-medium">{messages.ui.pageNumberPosition}</span>
            <select value={position} onChange={(e) => setPosition(e.target.value as PageNumberPosition)} className="block rounded border border-border px-2 py-1">
              <option value="bottom-center">Bottom center</option>
              <option value="bottom-right">Bottom right</option>
            </select>
          </label>
          <label className="space-y-1 text-sm">
            <span className="font-medium">Font size</span>
            <input type="number" min={8} max={24} value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))} className="block w-20 rounded border border-border px-2 py-1" />
          </label>
        </div>
      )}
    </PdfToolShell>
  );
}
