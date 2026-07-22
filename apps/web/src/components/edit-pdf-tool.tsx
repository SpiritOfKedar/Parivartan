"use client";

import { useRef, useState } from "react";
import { addTextToPdf, type TextPosition } from "../lib/edit-pdf";
import { baseName, isPdf, loadPdfDocument } from "../lib/pdf-io";
import { downloadBlob } from "../lib/merge-pdf";
import { PdfToolShell } from "./pdf-tool-shell";
import { useTranslations } from "../lib/i18n/locale-provider";

type Phase = "idle" | "processing" | "done" | "error";

export function EditPdfTool() {
  const messages = useTranslations();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [text, setText] = useState("");
  const [fontSize, setFontSize] = useState(14);
  const [position, setPosition] = useState<TextPosition>("bottom");
  const [applyTo, setApplyTo] = useState<"all" | "first">("all");
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

  function clearFile() {
    setFile(null);
    setPageCount(0);
    setResultBlob(null);
    setError(null);
    setPhase("idle");
    if (inputRef.current) inputRef.current.value = "";
  }

  async function handleApply() {
    if (!file) return;

    setPhase("processing");
    setError(null);
    setResultBlob(null);

    try {
      const bytes = await addTextToPdf(file, {
        text,
        fontSize,
        position,
        pageIndices: applyTo === "all" ? "all" : [0],
      });
      setResultBlob(new Blob([bytes.slice()], { type: "application/pdf" }));
      setPhase("done");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : messages.ui.couldNotEditPdf);
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
      onClear={clearFile}
      phase={phase}
      error={error}
      actionLabel={messages.ui.addTextToPdf}
      processingLabel={messages.common.applying}
      onAction={() => void handleApply()}
      onDownload={() => {
        if (resultBlob && file) {
          downloadBlob(resultBlob, `${baseName(file.name)}-edited.pdf`);
        }
      }}
      resultReady={phase === "done" && !!resultBlob}
    >
      {file && (
        <div className="space-y-4">
          <p className="text-sm text-muted">{pageCount} page{pageCount === 1 ? "" : "s"}</p>
          <label className="block space-y-1">
            <span className="text-sm font-medium">Text to add</span>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={3}
              className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
              placeholder={messages.ui.enterTextOverlay}
            />
          </label>
          <div className="flex flex-wrap gap-4">
            <label className="space-y-1 text-sm">
              <span className="font-medium">Font size</span>
              <input
                type="number"
                min={8}
                max={72}
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
                className="block w-20 rounded border border-border px-2 py-1"
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-medium">{messages.ui.position}</span>
              <select
                value={position}
                onChange={(e) => setPosition(e.target.value as TextPosition)}
                className="block rounded border border-border px-2 py-1"
              >
                <option value="top">Top</option>
                <option value="center">Center</option>
                <option value="bottom">Bottom</option>
              </select>
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-medium">Apply to</span>
              <select
                value={applyTo}
                onChange={(e) => setApplyTo(e.target.value as "all" | "first")}
                className="block rounded border border-border px-2 py-1"
              >
                <option value="all">All pages</option>
                <option value="first">First page only</option>
              </select>
            </label>
          </div>
        </div>
      )}
    </PdfToolShell>
  );
}
