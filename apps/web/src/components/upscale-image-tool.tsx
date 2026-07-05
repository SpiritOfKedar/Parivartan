"use client";

import { getTool } from "@convert-hub/conversion-rules";
import { useEffect, useRef, useState } from "react";
import { isSupportedImage } from "../lib/image-io";
import { downloadBlob } from "../lib/merge-pdf";
import {
  upscaleImage,
  type UpscaleImageResult,
} from "../lib/upscale-image";

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

export function UpscaleImageTool() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [scale, setScale] = useState<2 | 4>(2);
  const [dragging, setDragging] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<UpscaleImageResult | null>(null);

  const tool = getTool("upscale-image");
  const maxBytes = tool?.clientMaxBytes ?? 25 * 1024 * 1024;

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
      setError("Only image files are accepted (JPEG, PNG, WebP, GIF).");
      setPhase("error");
      return;
    }

    if (incoming.size > maxBytes) {
      setError(`"${incoming.name}" exceeds the ${formatSize(maxBytes)} limit.`);
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

  async function handleUpscale() {
    if (!file) {
      return;
    }

    setPhase("processing");
    setError(null);
    setResult(null);
    setStatusMessage("Loading upscale model…");

    try {
      const output = await upscaleImage(file, scale);
      setResult(output);
      setStatusMessage(
        output.usedOnnx
          ? "Upscaled with AI super-resolution."
          : "Upscaled with high-quality resize fallback.",
      );
      setPhase("done");
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Could not upscale this image.",
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
        <p className="text-[15px] text-foreground">Select an image file</p>
        <p className="mt-1.5 text-sm text-muted">or drag and drop here</p>
        <p className="mt-3 text-xs text-faint">
          JPEG, PNG, WebP, GIF · up to {formatSize(maxBytes)} · processed locally
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
              Remove
            </button>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">Scale factor</p>
            <div className="flex flex-wrap gap-2">
              {([2, 4] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setScale(value)}
                  className={[
                    "rounded border px-3 py-1.5 text-sm",
                    scale === value
                      ? "border-foreground bg-foreground text-background"
                      : "border-border text-muted hover:bg-background-subtle hover:text-foreground",
                  ].join(" ")}
                >
                  {value}×
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => void handleUpscale()}
              disabled={phase === "processing"}
              className="rounded border border-foreground bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              {phase === "processing" ? "Upscaling…" : "Upscale image"}
            </button>

            {phase === "done" && result && (
              <button
                type="button"
                onClick={handleDownload}
                className="rounded border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-background-subtle"
              >
                Download upscaled image
              </button>
            )}
          </div>

          {statusMessage && phase === "done" && (
            <p className="text-sm text-muted">{statusMessage}</p>
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
