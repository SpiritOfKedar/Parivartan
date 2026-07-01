"use client";

import { useRef, useState } from "react";
import { downloadJobResult, uploadFileAndCreateJob, waitForJob } from "../lib/api-client";
import { downloadBlob } from "../lib/merge-pdf";
import { baseName } from "../lib/split-pdf";

type Phase = "idle" | "uploading" | "processing" | "done" | "error";

function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isPdf(file: File): boolean {
  return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
}

export function PdfToWordTool() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [progressLabel, setProgressLabel] = useState<string | null>(null);
  const [completedJobId, setCompletedJobId] = useState<string | null>(null);

  const maxBytes = 25 * 1024 * 1024;

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
    setCompletedJobId(null);
    setError(null);
    setPhase("idle");
    setProgressLabel(null);
  }

  function clearFile() {
    setFile(null);
    setCompletedJobId(null);
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

    setPhase("uploading");
    setError(null);
    setCompletedJobId(null);
    setProgressLabel("Uploading PDF…");

    try {
      const job = await uploadFileAndCreateJob(file, "pdf-to-word");
      setPhase("processing");
      setProgressLabel("Converting on server…");

      const finished = await waitForJob(job.id, (update) => {
        if (update.status === "processing") {
          setProgressLabel(
            update.progress > 0
              ? `Converting on server… ${update.progress}%`
              : "Converting on server…",
          );
        }
      });

      if (finished.status !== "done") {
        throw new Error("Conversion did not complete successfully.");
      }

      setCompletedJobId(finished.id);
      setPhase("done");
      setProgressLabel(null);
    } catch (cause) {
      const message =
        cause instanceof Error ? cause.message : "Could not convert this PDF.";
      setError(message);
      setPhase("error");
      setProgressLabel(null);
    }
  }

  async function handleDownload() {
    if (!completedJobId || !file) {
      return;
    }

    try {
      const blob = await downloadJobResult(completedJobId);
      downloadBlob(blob, `${baseName(file.name)}.docx`);
    } catch (cause) {
      const message =
        cause instanceof Error ? cause.message : "Download failed.";
      setError(message);
      setPhase("error");
    }
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
          Up to {formatSize(maxBytes)} · converted on our servers with LibreOffice
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

          <p className="text-sm text-muted">
            Your PDF is uploaded to our API, converted with LibreOffice, and deleted
            within 24 hours. Scanned PDFs are OCR&apos;d first when Tesseract is
            available on the server. Keep the document worker running (npm run
            dev:worker) in a second terminal while converting.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => void handleConvert()}
              disabled={phase === "uploading" || phase === "processing"}
              className="rounded border border-foreground bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              {phase === "uploading"
                ? "Uploading…"
                : phase === "processing"
                  ? "Converting…"
                  : "Convert to Word"}
            </button>

            {phase === "done" && completedJobId && (
              <button
                type="button"
                onClick={() => void handleDownload()}
                className="rounded border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-background-subtle"
              >
                Download .docx
              </button>
            )}
          </div>

          {(phase === "uploading" || phase === "processing") && progressLabel && (
            <p className="text-sm text-muted">{progressLabel}</p>
          )}

          {phase === "done" && (
            <p className="text-sm text-muted">
              Conversion complete. Download your editable Word document above.
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
