"use client";

import { getTool } from "@convert-hub/conversion-rules";
import { useRef, useState } from "react";
import { downloadBlob } from "../lib/merge-pdf";
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
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [quality, setQuality] = useState<JpegQuality>("high");
  const [dragging, setDragging] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [resultFileName, setResultFileName] = useState<string | null>(null);

  const tool = getTool("pdf-to-jpg");
  const maxBytes = tool?.clientMaxBytes ?? 25 * 1024 * 1024;

  async function selectFile(incoming: File) {
    if (!isPdf(incoming)) {
      setError("Only PDF files are accepted.");
      setPhase("error");
      return;
    }

    if (incoming.size > maxBytes) {
      setError(`"${incoming.name}" exceeds the ${formatSize(maxBytes)} limit.`);
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
      setError("Could not read this PDF.");
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
        cause instanceof Error ? cause.message : "Could not convert this PDF.";
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
        className={[
          "cursor-pointer rounded border border-dashed px-6 py-12 text-center transition-colors",
          dragging
            ? "border-border-strong bg-background-subtle"
            : "border-border hover:border-border-strong hover:bg-background-subtle",
        ].join(" ")}
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
        <p className="text-[15px] text-foreground">Select a PDF file</p>
        <p className="mt-1.5 text-sm text-muted">or drag and drop here</p>
        <p className="mt-3 text-xs text-faint">
          Up to {formatSize(maxBytes)} · processed locally in your browser
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
              Remove
            </button>
          </div>

          <fieldset className="space-y-2">
            <legend className="text-sm font-medium text-foreground">
              JPEG quality
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
              className="rounded border border-foreground bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              {phase === "converting" ? "Converting…" : "Convert to JPG"}
            </button>

            {phase === "done" && resultBlob && (
              <button
                type="button"
                onClick={handleDownload}
                className="rounded border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-background-subtle"
              >
                {pageCount === 1 ? "Download .jpg" : "Download ZIP"}
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
        <p className="text-sm text-red-700" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
