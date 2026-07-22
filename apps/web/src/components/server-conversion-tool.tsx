"use client";

import { getToolOutput } from "@convert-hub/shared";
import { useRef, useState, type ReactNode } from "react";
import {
  downloadJobResult,
  uploadFileAndCreateJob,
  waitForJob,
} from "../lib/api-client";
import { downloadBlob } from "../lib/merge-pdf";
import { baseName } from "../lib/split-pdf";
import { useTranslations } from "../lib/i18n/locale-provider";

type Phase = "idle" | "uploading" | "processing" | "done" | "error";

export interface ServerConversionToolProps {
  toolId: string;
  accept: string;
  uploadLabel: string;
  uploadHint: string;
  validateFile: (file: File) => string | null;
  convertLabel: string;
  convertingLabel?: string;
  downloadLabel: string;
  successMessage: string;
  getOptions?: () => Record<string, unknown>;
  children?: ReactNode;
}

function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ServerConversionTool({
  toolId,
  accept,
  uploadLabel,
  uploadHint,
  validateFile,
  convertLabel,
  convertingLabel,
  downloadLabel,
  successMessage,
  getOptions,
  children,
}: ServerConversionToolProps) {
  const messages = useTranslations();
  const resolvedConvertingLabel = convertingLabel ?? messages.common.converting;
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [progressLabel, setProgressLabel] = useState<string | null>(null);
  const [completedJobId, setCompletedJobId] = useState<string | null>(null);

  const outputExtension = getToolOutput(toolId)?.extension ?? ".bin";

  function selectFile(incoming: File) {
    const validationError = validateFile(incoming);
    if (validationError) {
      setError(validationError);
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
    setProgressLabel(messages.ui.uploading);

    try {
      const job = await uploadFileAndCreateJob(file, toolId, getOptions?.());
      setPhase("processing");
      setProgressLabel(messages.ui.convertingOnServer);

      const finished = await waitForJob(job.id, (update) => {
        if (update.status === "processing") {
          setProgressLabel(
            update.progress > 0
              ? `${messages.ui.convertingOnServer} ${update.progress}%`
              : messages.ui.convertingOnServer,
          );
        }
      });

      if (finished.status !== "done") {
        throw new Error(messages.ui.conversionFailed);
      }

      setCompletedJobId(finished.id);
      setPhase("done");
      setProgressLabel(null);
    } catch (cause) {
      const message =
        cause instanceof Error ? cause.message : messages.ui.couldNotConvertFile;
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
      downloadBlob(blob, `${baseName(file.name)}${outputExtension}`);
    } catch (cause) {
      const message =
        cause instanceof Error ? cause.message : messages.ui.downloadFailed;
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
        data-dragging={dragging}
        className="glass-dropzone cursor-pointer px-6 py-14 text-center"
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(event) => {
            const selected = event.target.files?.[0];
            if (selected) {
              selectFile(selected);
            }
            event.target.value = "";
          }}
        />
        <p className="text-[15px] text-foreground">{uploadLabel}</p>
        <p className="mt-1.5 text-sm text-muted">{messages.common.orDragDrop}</p>
        <p className="mt-3 text-xs text-faint">{uploadHint}</p>
      </div>

      {file && (
        <section className="space-y-6">
          <div className="flex items-baseline justify-between gap-4 rounded-xl border border-border bg-[var(--glass-bg)] px-4 py-3 backdrop-blur">
            <div className="min-w-0">
              <p className="truncate text-[15px] text-foreground">{file.name}</p>
              <p className="text-sm text-muted">{formatSize(file.size)}</p>
            </div>
            <button
              type="button"
              onClick={clearFile}
              className="shrink-0 text-sm text-muted transition-colors hover:text-foreground"
            >
              {messages.common.remove}
            </button>
          </div>

          {children}

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => void handleConvert()}
              disabled={phase === "uploading" || phase === "processing"}
              className="btn-primary"
            >
              {phase === "uploading"
                ? messages.ui.uploading
                : phase === "processing"
                  ? resolvedConvertingLabel
                  : convertLabel}
            </button>

            {phase === "done" && completedJobId && (
              <button
                type="button"
                onClick={() => void handleDownload()}
                className="btn-ghost"
              >
                {downloadLabel}
              </button>
            )}
          </div>

          {(phase === "uploading" || phase === "processing") && progressLabel && (
            <p className="text-sm text-muted">{progressLabel}</p>
          )}

          {phase === "done" && (
            <p className="text-sm text-muted">{successMessage}</p>
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

function isPdf(file: File): boolean {
  return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
}

function isWord(file: File): boolean {
  const lower = file.name.toLowerCase();
  return (
    lower.endsWith(".docx") ||
    lower.endsWith(".doc") ||
    file.type ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    file.type === "application/msword"
  );
}

export function PdfToWordTool() {
  const messages = useTranslations();
  return (
    <ServerConversionTool
      toolId="pdf-to-word"
      accept="application/pdf,.pdf"
      uploadLabel={messages.common.selectPdf}
      uploadHint={messages.notes.server}
      validateFile={(file) =>
        isPdf(file) ? null : messages.ui.onlyPdfAccepted
      }
      convertLabel={messages.ui.convertToWord}
      downloadLabel={messages.ui.downloadDocx}
      successMessage={messages.ui.conversionCompleteWord}
    />
  );
}

export function PdfToPptTool() {
  const messages = useTranslations();
  return (
    <ServerConversionTool
      toolId="pdf-to-ppt"
      accept="application/pdf,.pdf"
      uploadLabel={messages.common.selectPdf}
      uploadHint={messages.notes.server}
      validateFile={(file) =>
        isPdf(file) ? null : messages.ui.onlyPdfAccepted
      }
      convertLabel={messages.ui.convertToPowerPoint}
      downloadLabel={messages.ui.downloadPptx}
      successMessage={messages.ui.conversionCompletePpt}
    />
  );
}

export function PdfToExcelTool() {
  const messages = useTranslations();
  return (
    <ServerConversionTool
      toolId="pdf-to-excel"
      accept="application/pdf,.pdf"
      uploadLabel={messages.common.selectPdf}
      uploadHint={messages.notes.server}
      validateFile={(file) =>
        isPdf(file) ? null : messages.ui.onlyPdfAccepted
      }
      convertLabel={messages.ui.convertToExcel}
      downloadLabel={messages.ui.downloadXlsx}
      successMessage={messages.ui.conversionCompleteExcel}
    />
  );
}

export function WordToPdfTool() {
  const messages = useTranslations();
  return (
    <ServerConversionTool
      toolId="word-to-pdf"
      accept=".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      uploadLabel={messages.common.selectWord}
      uploadHint={messages.notes.server}
      validateFile={(file) =>
        isWord(file) ? null : messages.ui.onlyWordAccepted
      }
      convertLabel={messages.ui.convertToPdf}
      downloadLabel={messages.common.downloadPdf}
      successMessage={messages.ui.conversionCompletePdf}
    />
  );
}
