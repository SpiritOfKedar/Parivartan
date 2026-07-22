"use client";

import { useEffect, useRef, useState } from "react";
import { isSupportedImage } from "../lib/image-io";
import { downloadBlob } from "../lib/merge-pdf";
import {
  removeImageBackground,
  type RemoveBackgroundResult,
} from "../lib/remove-background";
import { useTranslations } from "../lib/i18n/locale-provider";

type Phase = "idle" | "processing" | "done" | "error";

function formatSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function RemoveBackgroundTool() {
  const messages = useTranslations();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RemoveBackgroundResult | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  function revokePreview() {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
  }

  function selectFile(incoming: File) {
    if (!isSupportedImage(incoming)) {
      setError(messages.ui.onlyImagesAccepted);
      setPhase("error");
      return;
    }

    revokePreview();
    setFile(incoming);
    setPreviewUrl(URL.createObjectURL(incoming));
    setResult(null);
    setError(null);
    setStatusMessage(null);
    setPhase("idle");
  }

  function clearFile() {
    revokePreview();
    setFile(null);
    setPreviewUrl(null);
    setResult(null);
    setError(null);
    setStatusMessage(null);
    setPhase("idle");
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  async function handleRemoveBackground() {
    if (!file) {
      return;
    }

    setPhase("processing");
    setError(null);
    setResult(null);
    setStatusMessage(messages.ui.loadingBgModel);

    try {
      const output = await removeImageBackground(file, (message, current, total) => {
        if (total > 0) {
          setStatusMessage(`${message} (${Math.round((current / total) * 100)}%)`);
        } else {
          setStatusMessage(message);
        }
      });
      setResult(output);
      setStatusMessage(messages.ui.backgroundRemoved);
      setPhase("done");
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : messages.ui.couldNotRemoveBg,
      );
      setPhase("error");
    }
  }

  function handleDownload() {
    if (!result) {
      return;
    }
    downloadBlob(result.blob, result.fileName);
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
        className="glass-dropzone cursor-pointer px-6 py-12 text-center"
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,.jpg,.jpeg,.png,.webp,.gif"
          className="hidden"
          onChange={(event) => {
            const selected = event.target.files?.[0];
            if (selected) {
              selectFile(selected);
            }
            event.target.value = "";
          }}
        />
        <p className="text-[15px] text-foreground">{messages.common.selectImage}</p>
        <p className="mt-1.5 text-sm text-muted">{messages.common.orDragDrop}</p>
        <p className="mt-3 text-xs text-faint">
          JPEG, PNG, WebP, GIF · processed locally
        </p>
      </div>

      {file && (
        <section className="space-y-6">
          <div className="flex items-start gap-4 rounded border border-border bg-background px-4 py-3">
            {previewUrl && (
              <img
                src={previewUrl}
                alt={file.name}
                className="h-16 w-16 shrink-0 rounded border border-border object-cover"
              />
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-[15px] text-foreground">{file.name}</p>
              <p className="text-sm text-muted">{formatSize(file.size)}</p>
            </div>
            <button
              type="button"
              onClick={clearFile}
              className="shrink-0 text-sm text-muted hover:text-foreground"
            >
              {messages.common.remove}
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => void handleRemoveBackground()}
              disabled={phase === "processing"}
              className="btn-primary"
            >
              {phase === "processing" ? messages.ui.removingBackground : messages.ui.removeBackground}
            </button>

            {phase === "done" && result && (
              <button
                type="button"
                onClick={handleDownload}
                className="btn-ghost"
              >
                {messages.common.download}
              </button>
            )}
          </div>

          {statusMessage && phase === "processing" && (
            <p className="text-sm text-muted">{statusMessage}</p>
          )}
          {statusMessage && phase === "done" && (
            <p className="text-sm text-muted">{statusMessage}</p>
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
