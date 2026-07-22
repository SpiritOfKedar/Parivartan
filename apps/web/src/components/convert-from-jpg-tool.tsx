"use client";

import { useEffect, useRef, useState } from "react";
import {
  convertImageFormat,
  imagesToAnimatedGif,
} from "../lib/convert-image";
import { downloadBlob } from "../lib/merge-pdf";
import { useTranslations } from "../lib/i18n/locale-provider";

type Phase = "idle" | "processing" | "done" | "error";
type OutputMode = "png" | "webp" | "gif";

function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isJpeg(file: File): boolean {
  const lower = file.name.toLowerCase();
  return (
    file.type === "image/jpeg" ||
    lower.endsWith(".jpg") ||
    lower.endsWith(".jpeg")
  );
}

export function ConvertFromJpgTool() {
  const messages = useTranslations();
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [mode, setMode] = useState<OutputMode>("png");
  const [delayMs, setDelayMs] = useState(400);
  const [dragging, setDragging] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<
    { blob: Blob; fileName: string }[]
  >([]);

  useEffect(() => {
    return () => {
      for (const url of previewUrls) {
        URL.revokeObjectURL(url);
      }
    };
  }, [previewUrls]);

  function selectFiles(incoming: FileList | File[]) {
    const list = Array.from(incoming).filter(isJpeg);
    if (list.length === 0) {
      setError(messages.ui.onlyJpgAccepted);
      setPhase("error");
      return;
    }

    for (const url of previewUrls) {
      URL.revokeObjectURL(url);
    }

    setFiles(list);
    setPreviewUrls(list.map((file) => URL.createObjectURL(file)));
    setResults([]);
    setError(null);
    setPhase("idle");
  }

  function clearFiles() {
    for (const url of previewUrls) {
      URL.revokeObjectURL(url);
    }
    setFiles([]);
    setPreviewUrls([]);
    setResults([]);
    setError(null);
    setPhase("idle");
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  async function handleConvert() {
    if (files.length === 0) {
      return;
    }

    setPhase("processing");
    setError(null);
    setResults([]);

    try {
      if (mode === "gif") {
        const gif = await imagesToAnimatedGif(files, delayMs);
        setResults([{ blob: gif.blob, fileName: gif.fileName }]);
      } else {
        const converted = await Promise.all(
          files.map((file) => convertImageFormat(file, mode)),
        );
        setResults(
          converted.map((item) => ({
            blob: item.blob,
            fileName: item.fileName,
          })),
        );
      }
      setPhase("done");
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : messages.ui.couldNotConvertImages,
      );
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
          if (event.dataTransfer.files.length > 0) {
            selectFiles(event.dataTransfer.files);
          }
        }}
        data-dragging={dragging}
        className="glass-dropzone cursor-pointer px-6 py-12 text-center"
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/jpeg,.jpg,.jpeg"
          className="hidden"
          onChange={(event) => {
            if (event.target.files?.length) {
              selectFiles(event.target.files);
            }
            event.target.value = "";
          }}
        />
        <p className="text-[15px] text-foreground">{messages.common.selectJpg}</p>
        <p className="mt-1.5 text-sm text-muted">{messages.common.orDragDrop}</p>
        <p className="mt-3 text-xs text-faint">
          JPG / JPEG · processed locally
        </p>
      </div>

      {files.length > 0 && (
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted">{files.length} file(s) selected</p>
            <button
              type="button"
              onClick={clearFiles}
              className="text-sm text-muted hover:text-foreground"
            >
              Clear
            </button>
          </div>

          <ul className="space-y-2">
            {files.map((file, index) => (
              <li
                key={`${file.name}-${index}`}
                className="flex items-center gap-3 rounded border border-border px-3 py-2"
              >
                {previewUrls[index] && (
                  <img
                    src={previewUrls[index]}
                    alt=""
                    className="h-10 w-10 rounded object-cover"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm">{file.name}</p>
                  <p className="text-xs text-muted">{formatSize(file.size)}</p>
                </div>
              </li>
            ))}
          </ul>

          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">Convert to</p>
            <div className="flex flex-wrap gap-2">
              {([
                ["png", "PNG"],
                ["webp", "WebP"],
                ["gif", "Animated GIF"],
              ] as const).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setMode(value)}
                  className={[
                    "rounded border px-2.5 py-1 text-sm",
                    mode === value
                      ? "border-foreground bg-foreground text-background"
                      : "border-border text-muted hover:bg-background-subtle hover:text-foreground",
                  ].join(" ")}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {mode === "gif" && (
            <label className="block space-y-1">
              <span className="text-sm font-medium text-foreground">
                Frame delay (ms)
              </span>
              <input
                type="number"
                min={50}
                max={2000}
                step={50}
                value={delayMs}
                onChange={(event) =>
                  setDelayMs(Number(event.target.value) || 400)
                }
                className="block w-32 rounded border border-border bg-background px-3 py-2 text-sm"
              />
            </label>
          )}

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => void handleConvert()}
              disabled={phase === "processing"}
              className="btn-primary"
            >
              {phase === "processing" ? messages.common.converting : messages.ui.convertToImage}
            </button>
            {phase === "done" &&
              results.map((result) => (
                <button
                  key={result.fileName}
                  type="button"
                  onClick={() => downloadBlob(result.blob, result.fileName)}
                  className="btn-ghost"
                >
                  Download {result.fileName}
                </button>
              ))}
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
