"use client";

import { useEffect, useRef, useState } from "react";
import { convertImageFormat } from "../lib/convert-image";
import { isSupportedImage } from "../lib/image-io";
import { downloadBlob } from "../lib/merge-pdf";
import { useTranslations } from "../lib/i18n/locale-provider";

type Phase = "idle" | "processing" | "done" | "error";

function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ConvertToJpgTool() {
  const messages = useTranslations();
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [quality, setQuality] = useState(0.92);
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
    const list = Array.from(incoming).filter(isSupportedImage);
    if (list.length === 0) {
      setError(messages.ui.onlyImagesAcceptedShort);
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
      const converted = await Promise.all(
        files.map((file) => convertImageFormat(file, "jpeg", quality)),
      );
      setResults(
        converted.map((item) => ({
          blob: item.blob,
          fileName: item.fileName.endsWith(".jpg")
            ? item.fileName
            : `${item.fileName.replace(/\.[^.]+$/, "")}.jpg`,
        })),
      );
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
          accept="image/*,.png,.gif,.webp,.jpg,.jpeg,.bmp,.tif,.tiff"
          className="hidden"
          onChange={(event) => {
            if (event.target.files?.length) {
              selectFiles(event.target.files);
            }
            event.target.value = "";
          }}
        />
        <p className="text-[15px] text-foreground">{messages.common.selectImages}</p>
        <p className="mt-1.5 text-sm text-muted">{messages.common.orDragDrop}</p>
        <p className="mt-3 text-xs text-faint">
          PNG, GIF, WebP, and more · processed locally
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

          <label className="block space-y-2">
            <span className="text-sm font-medium text-foreground">
              {messages.ui.quality} ({Math.round(quality * 100)}%)
            </span>
            <input
              type="range"
              min={0.5}
              max={1}
              step={0.01}
              value={quality}
              onChange={(event) => setQuality(Number(event.target.value))}
              className="w-full"
            />
          </label>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => void handleConvert()}
              disabled={phase === "processing"}
              className="btn-primary"
            >
              {phase === "processing" ? messages.common.converting : messages.ui.convertToJpg}
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
