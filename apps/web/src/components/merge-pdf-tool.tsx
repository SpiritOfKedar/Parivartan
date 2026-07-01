"use client";

import { getTool } from "@convert-hub/conversion-rules";
import { useRef, useState } from "react";
import { downloadBlob, mergePdfFiles } from "../lib/merge-pdf";

type Phase = "idle" | "merging" | "done" | "error";

function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isPdf(file: File): boolean {
  return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
}

export function MergePdfTool() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [dragging, setDragging] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);

  const tool = getTool("merge-pdf");
  const maxBytes = tool?.clientMaxBytes ?? 10 * 1024 * 1024;

  function addFiles(incoming: FileList | File[]) {
    const list = Array.from(incoming);
    const pdfs = list.filter(isPdf);
    const rejected = list.length - pdfs.length;

    if (rejected > 0) {
      setError("Only PDF files are accepted.");
      setPhase("error");
    } else {
      setError(null);
      if (phase === "error") {
        setPhase("idle");
      }
    }

    const oversized = pdfs.find((file) => file.size > maxBytes);
    if (oversized) {
      setError(
        `"${oversized.name}" exceeds the ${formatSize(maxBytes)} limit per file.`,
      );
      setPhase("error");
      return;
    }

    setFiles((current) => [...current, ...pdfs]);
    setResultBlob(null);
    if (phase === "done") {
      setPhase("idle");
    }
  }

  function removeFile(index: number) {
    setFiles((current) => current.filter((_, i) => i !== index));
    setResultBlob(null);
    setPhase("idle");
    setError(null);
  }

  function moveFile(index: number, direction: -1 | 1) {
    const next = index + direction;
    if (next < 0 || next >= files.length) {
      return;
    }
    setFiles((current) => {
      const copy = [...current];
      [copy[index], copy[next]] = [copy[next]!, copy[index]!];
      return copy;
    });
    setResultBlob(null);
    setPhase("idle");
  }

  function clearAll() {
    setFiles([]);
    setResultBlob(null);
    setError(null);
    setPhase("idle");
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  async function handleMerge() {
    if (files.length < 2) {
      setError("Select at least two PDF files to merge.");
      setPhase("error");
      return;
    }

    setPhase("merging");
    setError(null);
    setResultBlob(null);

    try {
      const bytes = await mergePdfFiles(files);
      setResultBlob(new Blob([bytes], { type: "application/pdf" }));
      setPhase("done");
    } catch (cause) {
      const message =
        cause instanceof Error
          ? cause.message.includes("encrypted")
            ? "One of the PDFs is password-protected. Remove the password and try again."
            : "Could not merge these PDFs. Check that each file is valid."
          : "Could not merge these PDFs.";
      setError(message);
      setPhase("error");
    }
  }

  function handleDownload() {
    if (!resultBlob) {
      return;
    }
    downloadBlob(resultBlob, "merged.pdf");
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
          if (event.dataTransfer.files.length > 0) {
            addFiles(event.dataTransfer.files);
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
          multiple
          className="hidden"
          onChange={(event) => {
            if (event.target.files?.length) {
              addFiles(event.target.files);
              event.target.value = "";
            }
          }}
        />
        <p className="text-[15px] text-foreground">Select PDF files</p>
        <p className="mt-1.5 text-sm text-muted">or drag and drop here</p>
        <p className="mt-3 text-xs text-faint">
          Up to {formatSize(maxBytes)} per file · processed locally in your browser
        </p>
      </div>

      {files.length > 0 && (
        <section>
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="text-sm font-medium text-foreground">
              {files.length} file{files.length === 1 ? "" : "s"} selected
            </h2>
            <button
              type="button"
              onClick={clearAll}
              className="text-sm text-muted hover:text-foreground"
            >
              Clear all
            </button>
          </div>

          <ol className="mt-3 divide-y divide-border rounded border border-border bg-background">
            {files.map((file, index) => (
              <li
                key={`${file.name}-${file.size}-${index}`}
                className="flex items-center gap-3 px-4 py-3"
              >
                <span className="w-5 shrink-0 text-sm tabular-nums text-faint">
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] text-foreground">{file.name}</p>
                  <p className="text-sm text-muted">{formatSize(file.size)}</p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    aria-label={`Move ${file.name} up`}
                    disabled={index === 0}
                    onClick={() => moveFile(index, -1)}
                    className="px-2 py-1 text-sm text-muted hover:text-foreground disabled:opacity-30"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    aria-label={`Move ${file.name} down`}
                    disabled={index === files.length - 1}
                    onClick={() => moveFile(index, 1)}
                    className="px-2 py-1 text-sm text-muted hover:text-foreground disabled:opacity-30"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="px-2 py-1 text-sm text-muted hover:text-foreground"
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ol>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleMerge}
              disabled={phase === "merging" || files.length < 2}
              className="rounded border border-foreground bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              {phase === "merging" ? "Merging…" : "Merge PDFs"}
            </button>

            {phase === "done" && resultBlob && (
              <button
                type="button"
                onClick={handleDownload}
                className="rounded border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-background-subtle"
              >
                Download merged.pdf
              </button>
            )}
          </div>

          {files.length === 1 && phase !== "error" && (
            <p className="mt-3 text-sm text-muted">Add at least one more PDF to merge.</p>
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
