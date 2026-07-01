"use client";

import type { ReactNode, RefObject } from "react";
import { formatFileSize } from "../lib/pdf-io";

type Phase = "idle" | "processing" | "done" | "error";

interface PdfToolShellProps {
  inputRef: RefObject<HTMLInputElement | null>;
  dragging: boolean;
  setDragging: (v: boolean) => void;
  maxBytes: number;
  onSelect: (file: File) => void;
  file: File | null;
  onClear: () => void;
  phase: Phase;
  error: string | null;
  actionLabel: string;
  processingLabel: string;
  onAction: () => void;
  onDownload: () => void;
  resultReady: boolean;
  downloadLabel?: string;
  children?: ReactNode;
}

export function PdfToolShell({
  inputRef,
  dragging,
  setDragging,
  maxBytes,
  onSelect,
  file,
  onClear,
  phase,
  error,
  actionLabel,
  processingLabel,
  onAction,
  onDownload,
  resultReady,
  downloadLabel = "Download PDF",
  children,
}: PdfToolShellProps) {
  return (
    <div className="space-y-6">
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const dropped = e.dataTransfer.files[0];
          if (dropped) onSelect(dropped);
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
          onChange={(e) => {
            const selected = e.target.files?.[0];
            if (selected) onSelect(selected);
            e.target.value = "";
          }}
        />
        <p className="text-[15px] text-foreground">Select a PDF file</p>
        <p className="mt-1.5 text-sm text-muted">or drag and drop here</p>
        <p className="mt-3 text-xs text-faint">
          Up to {formatFileSize(maxBytes)} · processed locally
        </p>
      </div>

      {file && (
        <section className="space-y-6">
          <div className="flex items-baseline justify-between gap-4 rounded border border-border bg-background px-4 py-3">
            <div className="min-w-0">
              <p className="truncate text-[15px]">{file.name}</p>
              <p className="text-sm text-muted">{formatFileSize(file.size)}</p>
            </div>
            <button
              type="button"
              onClick={onClear}
              className="text-sm text-muted hover:text-foreground"
            >
              Remove
            </button>
          </div>
          {children}
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={onAction}
              disabled={phase === "processing"}
              className="rounded border border-foreground bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-40"
            >
              {phase === "processing" ? processingLabel : actionLabel}
            </button>
            {resultReady && (
              <button
                type="button"
                onClick={onDownload}
                className="rounded border border-border px-4 py-2 text-sm hover:bg-background-subtle"
              >
                {downloadLabel}
              </button>
            )}
          </div>
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
