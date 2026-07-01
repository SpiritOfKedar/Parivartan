"use client";

import { getTool } from "@convert-hub/conversion-rules";
import { useRef, useState } from "react";
import { downloadBlob } from "../lib/merge-pdf";
import {
  baseName,
  getPdfPageCount,
  splitPdf,
  type SplitMode,
  zipSplitParts,
} from "../lib/split-pdf";

type Phase = "idle" | "loading" | "splitting" | "done" | "error";

function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isPdf(file: File): boolean {
  return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
}

const SPLIT_MODES: { id: SplitMode; label: string; description: string }[] = [
  {
    id: "each-page",
    label: "Every page separately",
    description: "Create one PDF per page and download as a ZIP file.",
  },
  {
    id: "ranges",
    label: "Split by ranges",
    description: "Each range becomes its own PDF. Example: 1-3, 4-6",
  },
  {
    id: "extract",
    label: "Extract to one PDF",
    description: "Pull selected pages into a single new PDF. Example: 1, 3-5",
  },
];

export function SplitPdfTool() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [mode, setMode] = useState<SplitMode>("each-page");
  const [rangeInput, setRangeInput] = useState("");
  const [dragging, setDragging] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [resultCount, setResultCount] = useState(0);
  const [resultName, setResultName] = useState("");

  const tool = getTool("split-pdf");
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
    setResultCount(0);
    setError(null);
    setPhase("loading");

    try {
      const count = await getPdfPageCount(incoming);
      setPageCount(count);
      setPhase("idle");
    } catch {
      setPageCount(null);
      setError("Could not read this PDF. Check that the file is valid.");
      setPhase("error");
    }
  }

  function clearFile() {
    setFile(null);
    setPageCount(null);
    setResultBlob(null);
    setResultCount(0);
    setError(null);
    setPhase("idle");
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  async function handleSplit() {
    if (!file) {
      return;
    }

    if (mode !== "each-page" && !rangeInput.trim()) {
      setError("Enter which pages to split or extract.");
      setPhase("error");
      return;
    }

    setPhase("splitting");
    setError(null);
    setResultBlob(null);

    try {
      const parts = await splitPdf(file, mode, rangeInput);
      setResultCount(parts.length);

      if (parts.length === 1) {
        const part = parts[0]!;
        const buffer = part.bytes.buffer.slice(
          part.bytes.byteOffset,
          part.bytes.byteOffset + part.bytes.byteLength,
        ) as ArrayBuffer;
        setResultBlob(new Blob([buffer], { type: "application/pdf" }));
        setResultName(part.name);
      } else {
        const zip = await zipSplitParts(parts);
        setResultBlob(zip);
        setResultName(`${baseName(file.name)}-split.zip`);
      }

      setPhase("done");
    } catch (cause) {
      const message =
        cause instanceof Error
          ? cause.message.includes("encrypted") || cause.message.includes("password")
            ? "This PDF is password-protected. Remove the password and try again."
            : cause.message.includes("Invalid page")
              ? cause.message
              : "Could not split this PDF. Check that the file is valid."
          : "Could not split this PDF.";
      setError(message);
      setPhase("error");
    }
  }

  function handleDownload() {
    if (!resultBlob) {
      return;
    }
    downloadBlob(resultBlob, resultName);
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
                {pageCount !== null ? ` · ${pageCount} page${pageCount === 1 ? "" : "s"}` : ""}
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

          <div>
            <p className="text-sm font-medium text-foreground">How to split</p>
            <div className="mt-3 space-y-2">
              {SPLIT_MODES.map((option) => (
                <label
                  key={option.id}
                  className={[
                    "flex cursor-pointer gap-3 rounded border px-4 py-3 transition-colors",
                    mode === option.id
                      ? "border-foreground bg-background-subtle"
                      : "border-border hover:bg-background-subtle",
                  ].join(" ")}
                >
                  <input
                    type="radio"
                    name="split-mode"
                    value={option.id}
                    checked={mode === option.id}
                    onChange={() => setMode(option.id)}
                    className="mt-1"
                  />
                  <span>
                    <span className="text-sm font-medium text-foreground">
                      {option.label}
                    </span>
                    <span className="mt-0.5 block text-sm text-muted">
                      {option.description}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </div>

          {mode !== "each-page" && (
            <div>
              <label htmlFor="page-ranges" className="text-sm font-medium text-foreground">
                Pages
              </label>
              <input
                id="page-ranges"
                type="text"
                value={rangeInput}
                onChange={(event) => {
                  setRangeInput(event.target.value);
                  setError(null);
                  if (phase === "error") {
                    setPhase("idle");
                  }
                }}
                placeholder={mode === "ranges" ? "1-3, 4-6" : "1, 3-5, 8"}
                className="mt-2 w-full max-w-md rounded border border-border bg-background px-3 py-2.5 text-sm text-foreground"
              />
              <p className="mt-1.5 text-xs text-faint">
                Page numbers are 1-based. This file has {pageCount ?? "?"} pages.
              </p>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => void handleSplit()}
              disabled={phase === "splitting" || phase === "loading"}
              className="rounded border border-foreground bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              {phase === "splitting" ? "Splitting…" : "Split PDF"}
            </button>

            {phase === "done" && resultBlob && (
              <button
                type="button"
                onClick={handleDownload}
                className="rounded border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-background-subtle"
              >
                Download {resultCount === 1 ? "PDF" : "ZIP"}
              </button>
            )}
          </div>

          {phase === "done" && resultCount > 0 && (
            <p className="text-sm text-muted">
              Created {resultCount} file{resultCount === 1 ? "" : "s"} from your PDF.
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
