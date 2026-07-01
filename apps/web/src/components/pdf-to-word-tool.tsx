"use client";

import { getTool } from "@convert-hub/conversion-rules";
import { useRef, useState } from "react";
import { downloadBlob } from "../lib/merge-pdf";
import {
  convertPdfToWord,
  type PdfToWordMode,
  wordOutputName,
} from "../lib/pdf-to-word";

type Phase = "idle" | "converting" | "done" | "error";

function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isPdf(file: File): boolean {
  return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
}

const CONVERSION_MODES: {
  id: PdfToWordMode;
  label: string;
  description: string;
}[] = [
  {
    id: "auto",
    label: "Smart (recommended)",
    description:
      "Detects tables and text layout. Uses a page image only when the PDF is scanned or has no structure.",
  },
  {
    id: "text",
    label: "Editable text and tables",
    description:
      "Rebuilds paragraphs and tables from PDF text. Best for marksheets, forms, and reports.",
  },
  {
    id: "visual",
    label: "Visual layout",
    description:
      "Embeds each page as a high-resolution image. Best for scanned documents.",
  },
];

export function PdfToWordTool() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<PdfToWordMode>("auto");
  const [dragging, setDragging] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [progressLabel, setProgressLabel] = useState<string | null>(null);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);

  const tool = getTool("pdf-to-word");
  const maxBytes = tool?.clientMaxBytes ?? 15 * 1024 * 1024;

  function selectFile(incoming: File) {
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
    setError(null);
    setPhase("idle");
    setProgressLabel(null);
  }

  function clearFile() {
    setFile(null);
    setResultBlob(null);
    setError(null);
    setPhase("idle");
    setProgressLabel(null);
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
    setProgressLabel("Loading PDF…");

    try {
      const blob = await convertPdfToWord(file, mode, (progress) => {
        setProgressLabel(progress.label);
      });
      setResultBlob(blob);
      setPhase("done");
      setProgressLabel(null);
    } catch (cause) {
      const message =
        cause instanceof Error
          ? cause.message.includes("password") || cause.message.includes("encrypted")
            ? "This PDF is password-protected. Remove the password and try again."
            : "Could not convert this PDF. Check that the file is valid."
          : "Could not convert this PDF.";
      setError(message);
      setPhase("error");
      setProgressLabel(null);
    }
  }

  function handleDownload() {
    if (!resultBlob || !file) {
      return;
    }
    downloadBlob(resultBlob, wordOutputName(file.name));
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
            selectFile(dropped);
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
              selectFile(selected);
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
              <p className="text-sm text-muted">{formatSize(file.size)}</p>
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
            <p className="text-sm font-medium text-foreground">Conversion mode</p>
            <div className="mt-3 space-y-2">
              {CONVERSION_MODES.map((option) => (
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
                    name="word-mode"
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

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => void handleConvert()}
              disabled={phase === "converting"}
              className="rounded border border-foreground bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              {phase === "converting" ? "Converting…" : "Convert to Word"}
            </button>

            {phase === "done" && resultBlob && (
              <button
                type="button"
                onClick={handleDownload}
                className="rounded border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-background-subtle"
              >
                Download .docx
              </button>
            )}
          </div>

          {phase === "converting" && progressLabel && (
            <p className="text-sm text-muted">{progressLabel}</p>
          )}

          {phase === "done" && (
            <p className="text-sm text-muted">
              Your Word document is ready. Open it in Microsoft Word, Google Docs, or
              LibreOffice to edit.
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
