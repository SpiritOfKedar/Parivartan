"use client";

import { getTool } from "@convert-hub/conversion-rules";
import { useRef, useState } from "react";
import { downloadBlob } from "../lib/merge-pdf";
import { baseName, formatFileSize, isPdf } from "../lib/pdf-io";
import { watermarkPdf } from "../lib/watermark-pdf";
import { PdfToolShell } from "./pdf-tool-shell";

type Phase = "idle" | "processing" | "done" | "error";

export function WatermarkPdfTool() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState("CONFIDENTIAL");
  const [opacity, setOpacity] = useState(0.3);
  const [fontSize, setFontSize] = useState(48);
  const [dragging, setDragging] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);

  const tool = getTool("watermark-pdf");
  const maxBytes = tool?.clientMaxBytes ?? 25 * 1024 * 1024;

  function selectFile(incoming: File) {
    if (!isPdf(incoming)) {
      setError("Only PDF files are accepted.");
      setPhase("error");
      return;
    }
    if (incoming.size > maxBytes) {
      setError(`"${incoming.name}" exceeds the ${formatFileSize(maxBytes)} limit.`);
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
      setError(cause instanceof Error ? cause.message : "Could not watermark PDF.");
      setPhase("error");
    }
  }

  return (
    <PdfToolShell
      inputRef={inputRef}
      dragging={dragging}
      setDragging={setDragging}
      maxBytes={maxBytes}
      onSelect={selectFile}
      file={file}
      onClear={() => { setFile(null); setResultBlob(null); setError(null); setPhase("idle"); if (inputRef.current) inputRef.current.value = ""; }}
      phase={phase}
      error={error}
      actionLabel="Add watermark"
      processingLabel="Applying…"
      onAction={() => void handleWatermark()}
      onDownload={() => { if (resultBlob && file) downloadBlob(resultBlob, `${baseName(file.name)}-watermarked.pdf`); }}
      resultReady={phase === "done" && !!resultBlob}
    >
      {file && (
        <div className="space-y-4">
          <label className="block space-y-1 text-sm">
            <span className="font-medium">Watermark text</span>
            <input value={text} onChange={(e) => setText(e.target.value)} className="w-full rounded border border-border px-3 py-2" />
          </label>
          <label className="block space-y-1 text-sm">
            <span className="font-medium">Opacity ({Math.round(opacity * 100)}%)</span>
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
