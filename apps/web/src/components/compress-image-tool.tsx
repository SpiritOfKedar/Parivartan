"use client";

import { useRef, useState } from "react";
import { compressImageToTarget, isSupportedImage } from "../lib/compress-image";
import { downloadBlob } from "../lib/merge-pdf";
import { useTranslations } from "../lib/i18n/locale-provider";

type Phase = "idle" | "compressing" | "done" | "error";

const TARGET_PRESETS_KB = [50, 100, 256, 500] as const;

function formatSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function CompressImageTool() {
  const messages = useTranslations();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [targetKbText, setTargetKbText] = useState("100");
  const [dragging, setDragging] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [resultFileName, setResultFileName] = useState<string | null>(null);
  const [resultMeta, setResultMeta] = useState<{
    originalBytes: number;
    compressedBytes: number;
    reachedTarget: boolean;
  } | null>(null);

  function parseTargetKb(): number {
    const parsed = parseInt(targetKbText, 10);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function normalizeTargetKb(): number {
    let kb = parseTargetKb();
    if (kb < 1) {
      kb = 100;
    }
    if (file) {
      const maxKb = Math.max(1, Math.floor((file.size - 1) / 1024));
      if (kb > maxKb) {
        kb = maxKb;
      }
    }
    setTargetKbText(String(kb));
    return kb;
  }

  function applyPreset(kb: number) {
    setTargetKbText(String(kb));
    setError(null);
    if (phase === "error") {
      setPhase("idle");
    }
  }

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
    setResultBlob(null);
    setResultFileName(null);
    setResultMeta(null);
    setError(null);
    setPhase("idle");

    const maxKb = Math.max(1, Math.floor((incoming.size - 1) / 1024));
    const currentKb = parseTargetKb();
    if (currentKb < 1 || currentKb > maxKb) {
      const defaultKb = Math.min(100, maxKb);
      setTargetKbText(String(defaultKb));
    }
  }

  function clearFile() {
    revokePreview();
    setFile(null);
    setPreviewUrl(null);
    setResultBlob(null);
    setResultFileName(null);
    setResultMeta(null);
    setError(null);
    setPhase("idle");
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  async function handleCompress() {
    if (!file) {
      return;
    }

    const targetKb = normalizeTargetKb();
    if (targetKb < 1) {
      setError(messages.ui.enterTargetSize);
      setPhase("error");
      return;
    }

    setPhase("compressing");
    setError(null);
    setResultBlob(null);
    setResultFileName(null);
    setResultMeta(null);

    try {
      const result = await compressImageToTarget(file, targetKb);
      setResultBlob(result.blob);
      setResultFileName(result.fileName);
      setResultMeta({
        originalBytes: result.originalBytes,
        compressedBytes: result.compressedBytes,
        reachedTarget: result.reachedTarget,
      });
      setPhase("done");
    } catch (cause) {
      const message =
        cause instanceof Error ? cause.message : messages.ui.couldNotCompressImage;
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

          <div className="space-y-3">
            <label className="block text-sm font-medium text-foreground">
              {messages.ui.targetSizeKb}
            </label>
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                inputMode="numeric"
                value={targetKbText}
                onChange={(event) => setTargetKbText(event.target.value)}
                onBlur={() => normalizeTargetKb()}
                className="w-24 rounded border border-border bg-background px-3 py-2 text-sm"
              />
              <span className="text-sm text-muted">KB</span>
              {TARGET_PRESETS_KB.map((kb) => (
                <button
                  key={kb}
                  type="button"
                  onClick={() => applyPreset(kb)}
                  className="rounded border border-border px-2.5 py-1 text-sm text-muted hover:bg-background-subtle hover:text-foreground"
                >
                  {kb} KB
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => void handleCompress()}
              disabled={phase === "compressing"}
              className="btn-primary"
            >
              {phase === "compressing" ? messages.ui.compressing : messages.ui.compressImage}
            </button>

            {phase === "done" && resultBlob && (
              <button
                type="button"
                onClick={handleDownload}
                className="btn-ghost"
              >
                {messages.common.download}
              </button>
            )}
          </div>

          {phase === "done" && resultMeta && (
            <p className="text-sm text-muted">
              {formatSize(resultMeta.originalBytes)} →{" "}
              {formatSize(resultMeta.compressedBytes)}
              {resultMeta.reachedTarget
                ? " · target reached"
                : " · closest size under target could not be reached"}
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
