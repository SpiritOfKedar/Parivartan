"use client";

import type { ReactNode, RefObject } from "react";
import { formatFileSize } from "../lib/pdf-io";
import { useTranslations } from "../lib/i18n/locale-provider";

type Phase = "idle" | "processing" | "done" | "error";

interface PdfToolShellProps {
  inputRef: RefObject<HTMLInputElement | null>;
  dragging: boolean;
  setDragging: (v: boolean) => void;
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
  downloadLabel,
  children,
}: PdfToolShellProps) {
  const messages = useTranslations();
  const resolvedDownload = downloadLabel ?? messages.common.downloadPdf;

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
        data-dragging={dragging}
        className="glass-dropzone cursor-pointer px-6 py-14 text-center"
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
        <p className="text-[15px] text-foreground">
          {messages.ui.selectPdfFile}
        </p>
        <p className="mt-1.5 text-sm text-muted">{messages.common.orDragDrop}</p>
        <p className="mt-3 text-xs text-faint">
          {messages.common.processedLocally}
        </p>
      </div>

      {file && (
        <section className="space-y-6">
          <div className="flex items-baseline justify-between gap-4 rounded-xl border border-border bg-[var(--glass-bg)] px-4 py-3 backdrop-blur">
            <div className="min-w-0">
              <p className="truncate text-[15px]">{file.name}</p>
              <p className="text-sm text-muted">{formatFileSize(file.size)}</p>
            </div>
            <button
              type="button"
              onClick={onClear}
              className="text-sm text-muted transition-colors hover:text-foreground"
            >
              {messages.common.remove}
            </button>
          </div>
          {children}
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={onAction}
              disabled={phase === "processing"}
              className="btn-primary"
            >
              {phase === "processing" ? processingLabel : actionLabel}
            </button>
            {resultReady && (
              <button type="button" onClick={onDownload} className="btn-ghost">
                {resolvedDownload}
              </button>
            )}
          </div>
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
