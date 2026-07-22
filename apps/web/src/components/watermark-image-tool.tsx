"use client";

import { useEffect, useRef, useState } from "react";
import { isSupportedImage, type ImageOutputFormat } from "../lib/image-io";
import { downloadBlob } from "../lib/merge-pdf";
import {
  watermarkImage,
  type WatermarkPosition,
} from "../lib/watermark-image";
import { useTranslations } from "../lib/i18n/locale-provider";

type Phase = "idle" | "processing" | "done" | "error";

function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function WatermarkImageTool() {
  const messages = useTranslations();
  const inputRef = useRef<HTMLInputElement>(null);
  const markRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [text, setText] = useState("WATERMARK");
  const [markFile, setMarkFile] = useState<File | null>(null);
  const [opacity, setOpacity] = useState(0.45);
  const [position, setPosition] = useState<WatermarkPosition>("center");
  const [format, setFormat] = useState<ImageOutputFormat>("jpeg");
  const [dragging, setDragging] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [resultName, setResultName] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  function selectFile(incoming: File) {
    if (!isSupportedImage(incoming)) {
      setError(messages.ui.onlyImagesAccepted);
      setPhase("error");
      return;
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setFile(incoming);
    setPreviewUrl(URL.createObjectURL(incoming));
    setResultBlob(null);
    setResultName(null);
    setError(null);
    setPhase("idle");
  }

  function clearFile() {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setFile(null);
    setPreviewUrl(null);
    setMarkFile(null);
    setResultBlob(null);
    setResultName(null);
    setError(null);
    setPhase("idle");
    if (inputRef.current) {
      inputRef.current.value = "";
    }
    if (markRef.current) {
      markRef.current.value = "";
    }
  }

  async function handleWatermark() {
    if (!file) {
      return;
    }

    setPhase("processing");
    setError(null);

    try {
      const output = await watermarkImage(file, {
        text: markFile ? undefined : text,
        watermarkFile: markFile ?? undefined,
        opacity,
        position,
        format,
      });
      setResultBlob(output.blob);
      setResultName(output.fileName);
      setPhase("done");
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : messages.ui.couldNotExportImage,
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
              <p className="truncate text-[15px]">{file.name}</p>
              <p className="text-sm text-muted">{formatSize(file.size)}</p>
            </div>
            <button
              type="button"
              onClick={clearFile}
              className="text-sm text-muted hover:text-foreground"
            >
              {messages.common.remove}
            </button>
          </div>

          <label className="block space-y-1">
            <span className="text-sm font-medium text-foreground">
              {messages.ui.watermarkText}
            </span>
            <input
              type="text"
              value={text}
              onChange={(event) => setText(event.target.value)}
              disabled={Boolean(markFile)}
              className="block w-full rounded border border-border bg-background px-3 py-2 text-sm disabled:opacity-50"
            />
          </label>

          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">
              Or use an image watermark
            </p>
            <input
              ref={markRef}
              type="file"
              accept="image/*"
              onChange={(event) => {
                setMarkFile(event.target.files?.[0] ?? null);
              }}
              className="block w-full text-sm"
            />
            {markFile && (
              <button
                type="button"
                onClick={() => {
                  setMarkFile(null);
                  if (markRef.current) {
                    markRef.current.value = "";
                  }
                }}
                className="text-sm text-muted hover:text-foreground"
              >
                Clear image watermark
              </button>
            )}
          </div>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-foreground">
              {messages.ui.opacity} ({Math.round(opacity * 100)}%)
            </span>
            <input
              type="range"
              min={0.1}
              max={1}
              step={0.05}
              value={opacity}
              onChange={(event) => setOpacity(Number(event.target.value))}
              className="w-full"
            />
          </label>

          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">{messages.ui.position}</p>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  "center",
                  "top-left",
                  "top-right",
                  "bottom-left",
                  "bottom-right",
                ] as const
              ).map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setPosition(value)}
                  className={[
                    "rounded border px-2.5 py-1 text-sm capitalize",
                    position === value
                      ? "border-foreground bg-foreground text-background"
                      : "border-border text-muted hover:bg-background-subtle hover:text-foreground",
                  ].join(" ")}
                >
                  {value.replace("-", " ")}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">Output format</p>
            <div className="flex flex-wrap gap-2">
              {(["jpeg", "png", "webp"] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setFormat(value)}
                  className={[
                    "rounded border px-2.5 py-1 text-sm uppercase",
                    format === value
                      ? "border-foreground bg-foreground text-background"
                      : "border-border text-muted hover:bg-background-subtle hover:text-foreground",
                  ].join(" ")}
                >
                  {value}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => void handleWatermark()}
              disabled={phase === "processing"}
              className="btn-primary"
            >
              {phase === "processing" ? messages.common.applying : messages.ui.watermarkImage}
            </button>
            {phase === "done" && resultBlob && resultName && (
              <button
                type="button"
                onClick={() => downloadBlob(resultBlob, resultName)}
                className="btn-ghost"
              >
                {messages.common.download}
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
