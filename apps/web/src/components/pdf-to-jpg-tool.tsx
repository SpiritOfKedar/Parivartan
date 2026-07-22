"use client";

import { useRef, useState } from "react";
import { downloadBlob } from "../lib/merge-pdf";
import { useTranslations } from "../lib/i18n/locale-provider";
import {
  convertPdfToJpg,
  getPdfPageCount,
  type JpegQuality,
} from "../lib/pdf-to-jpg";

type Phase = "idle" | "loading" | "converting" | "done" | "error";

function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isPdf(file: File): boolean {
  return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
}

export function PdfToJpgTool() {
  const messages = useTranslations();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [quality, setQuality] = useState<JpegQuality>("high");
  const [dragging, setDragging] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [resultFileName, setResultFileName] = useState<string | null>(null);

  async function selectFile(incoming: File) {
    if (!isPdf(incoming)) {
      setError(messages.ui.onlyPdfAccepted);
      setPhase("error");
      return;
    }

    setFile(incoming);
    setResultBlob(null);
    setResultFileName(null);
    setError(null);
    setPhase("loading");

    try {
      const count = await getPdfPageCount(incoming);
      setPageCount(count);
      setPhase("idle");
    } catch {
      setPageCount(null);
      setError(messages.ui.couldNotReadPdf);
      setPhase("error");
    }
  }

  function clearFile() {
    setFile(null);
    setPageCount(null);
    setResultBlob(null);
    setResultFileName(null);
    setError(null);
    setPhase("idle");
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  async function handleConvert() {
    if (!file) {
      return;
    }

    setPhase("converting");
    setError(null);
    setResultBlob(null);
    setResultFileName(null);

    try {
      const result = await convertPdfToJpg(file, quality);
      setResultBlob(result.blob);
      setResultFileName(result.fileName);
      setPageCount(result.pageCount);
      setPhase("done");
    } catch (cause) {
      const message =
        cause instanceof Error ? cause.message : messages.ui.couldNotConvertPdf;
      setError(message);
      setPhase("error");
    }
  }

  function handleDownload() {
    if (!resultBlob || !resultFileName) {
      return;
    }
    downloadBlob(resultBlob, resultFileName);
  }

  return (
    <div className="space-y-6">
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          const dropped = event.dataTransfer.files[0];
          if (dropped) {
            void selectFile(dropped);
          }
        }}
        data-dragging={dragging}
        className="glass-dropzone cursor-pointer px-6 py-12 text-center"
      >
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,.pdf"
          className="hidden"
          onChange={(event) => {
            const selected = event.target.files?.[0];
            if (selected) {
              void selectFile(selected);
            }
            event.target.value = "";
          }}
        />
        <p className="text-[15px] text-foreground">{messages.common.selectPdf}</p>
        <p className="mt-1.5 text-sm text-muted">{messages.common.orDragDrop}</p>
        <p className="mt-3 text-xs text-faint">
          {messages.common.processedLocally}
        </p>
      </div>

      {file && (
        <section className="space-y-6">
          <div className="flex items-baseline justify-between gap-4 rounded border border-border bg-background px-4 py-3">
            <div className="min-w-0">
              <p className="truncate text-[15px] text-foreground">{file.name}</p>
              <p className="text-sm text-muted">
                {formatSize(file.size)}
                {pageCount !== null && ` · ${pageCount} page${pageCount === 1 ? "" : "s"}`}
              </p>
            </div>
            <button
              type="button"
              onClick={clearFile}
              className="shrink-0 text-sm text-muted hover:text-foreground"
            >
              {messages.common.remove}
            </button>
          </div>

          <fieldset className="space-y-2">
            <legend className="text-sm font-medium text-foreground">
              {messages.ui.quality}
            </legend>
            <div className="flex flex-wrap gap-4 text-sm">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="jpeg-quality"
                  checked={quality === "high"}
                  onChange={() => setQuality("high")}
                />
                High
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="jpeg-quality"
                  checked={quality === "medium"}
                  onChange={() => setQuality("medium")}
                />
                Medium
              </label>
            </div>
          </fieldset>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => void handleConvert()}
              disabled={phase === "loading" || phase === "converting"}
              className="btn-primary"
            >
              {phase === "converting" ? messages.common.converting : messages.ui.convertToJpg}
            </button>

            {phase === "done" && resultBlob && (
              <button
                type="button"
                onClick={handleDownload}
                className="btn-ghost"
              >
                {pageCount === 1 ? messages.common.download : messages.ui.downloadZip}
              </button>
            )}
          </div>

          {phase === "done" && pageCount !== null && pageCount > 1 && (
            <p className="text-sm text-muted">
              {pageCount} JPEG files are packaged in a ZIP archive.
            </p>
          )}
        </section>
      )}

      {error && (
        <p className="text-sm text-red-400" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
