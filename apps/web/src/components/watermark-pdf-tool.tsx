"use client";

import { useRef, useState } from "react";
import { downloadBlob } from "../lib/merge-pdf";
import { baseName, formatFileSize, isPdf } from "../lib/pdf-io";
import { watermarkPdf } from "../lib/watermark-pdf";
import { PdfToolShell } from "./pdf-tool-shell";
import { useTranslations } from "../lib/i18n/locale-provider";

type Phase = "idle" | "processing" | "done" | "error";

export function WatermarkPdfTool() {
  const messages = useTranslations();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState("CONFIDENTIAL");
  const [opacity, setOpacity] = useState(0.3);
  const [fontSize, setFontSize] = useState(48);
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

  async function handleWatermark() {
    if (!file) return;
    setPhase("processing");
    setError(null);
    setResultBlob(null);
    try {
      const bytes = await watermarkPdf(file, { text, opacity, fontSize, angle: 45 });
      setResultBlob(new Blob([bytes.slice()], { type: "application/pdf" }));
      setPhase("done");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : messages.ui.couldNotWatermarkPdf);
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
      actionLabel={messages.ui.addWatermark}
      processingLabel={messages.common.applying}
      onAction={() => void handleWatermark()}
      onDownload={() => { if (resultBlob && file) downloadBlob(resultBlob, `${baseName(file.name)}-watermarked.pdf`); }}
      resultReady={phase === "done" && !!resultBlob}
    >
      {file && (
        <div className="space-y-4">
          <label className="block space-y-1 text-sm">
            <span className="font-medium">{messages.ui.watermarkText}</span>
            <input value={text} onChange={(e) => setText(e.target.value)} className="w-full rounded border border-border px-3 py-2" />
          </label>
          <label className="block space-y-1 text-sm">
            <span className="font-medium">{messages.ui.opacity} ({Math.round(opacity * 100)}%)</span>
            <input type="range" min={0.1} max={0.8} step={0.05} value={opacity} onChange={(e) => setOpacity(Number(e.target.value))} className="w-full" />
          </label>
          <label className="block space-y-1 text-sm">
            <span className="font-medium">Font size</span>
            <input type="number" min={24} max={120} value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))} className="w-24 rounded border border-border px-2 py-1" />
          </label>
        </div>
      )}
    </PdfToolShell>
  );
}
