"use client";

import { getTool } from "@convert-hub/conversion-rules";
import { useEffect, useRef, useState } from "react";
import { isSupportedImage } from "../lib/image-io";
import {
  dimensionsFromPercent,
  fitDimensions,
  resizeImage,
  type ResizeImageResult,
} from "../lib/resize-image";
import { downloadBlob } from "../lib/merge-pdf";
import type { ImageOutputFormat } from "../lib/image-io";

type Phase = "idle" | "processing" | "done" | "error";
type ResizeMode = "custom" | "percent";

const PERCENT_PRESETS = [25, 50, 75, 100] as const;

function formatSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ResizeImageTool() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [naturalSize, setNaturalSize] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const [mode, setMode] = useState<ResizeMode>("custom");
  const [percent, setPercent] = useState(50);
  const [widthText, setWidthText] = useState("");
  const [heightText, setHeightText] = useState("");
  const [lockAspectRatio, setLockAspectRatio] = useState(true);
  const [format, setFormat] = useState<ImageOutputFormat>("jpeg");
  const [dragging, setDragging] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ResizeImageResult | null>(null);

  const tool = getTool("resize-image");
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
    const url = URL.createObjectURL(incoming);
    const image = new Image();
    image.onload = () => {
      setNaturalSize({
        width: image.naturalWidth,
        height: image.naturalHeight,
      });
      setWidthText(String(image.naturalWidth));
      setHeightText(String(image.naturalHeight));
    };
    image.src = url;

    setFile(incoming);
    setPreviewUrl(url);
    setResult(null);
    setError(null);
    setPhase("idle");

    const lower = incoming.name.toLowerCase();
    if (incoming.type === "image/png" || lower.endsWith(".png")) {
      setFormat("png");
    } else if (incoming.type === "image/webp" || lower.endsWith(".webp")) {
      setFormat("webp");
    } else {
      setFormat("jpeg");
    }
  }

  function clearFile() {
    revokePreview();
    setFile(null);
    setPreviewUrl(null);
    setNaturalSize(null);
    setResult(null);
    setError(null);
    setPhase("idle");
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  function getTargetDimensions(): { width: number; height: number } | null {
    if (!naturalSize) {
      return null;
    }

    if (mode === "percent") {
      return dimensionsFromPercent(
        naturalSize.width,
        naturalSize.height,
        percent,
      );
    }

    const width = parseInt(widthText, 10);
    const height = parseInt(heightText, 10);
    if (!Number.isFinite(width) || !Number.isFinite(height)) {
      return null;
    }

    return fitDimensions(
      naturalSize.width,
      naturalSize.height,
      width,
      height,
      lockAspectRatio,
    );
  }

  async function handleResize() {
    if (!file || !naturalSize) {
      return;
    }

    const target = getTargetDimensions();
    if (!target) {
      setError("Enter valid width and height values.");
      setPhase("error");
      return;
    }

    setPhase("processing");
    setError(null);
    setResult(null);

    try {
      const output = await resizeImage(file, {
        width: target.width,
        height: target.height,
        lockAspectRatio: mode === "percent" ? true : lockAspectRatio,
        format,
      });
      setResult(output);
      setPhase("done");
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Could not resize this image.",
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

  const targetDimensions = getTargetDimensions();

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

      {file && naturalSize && (
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
              <p className="text-sm text-muted">
                {formatSize(file.size)} · {naturalSize.width}×{naturalSize.height}
              </p>
            </div>
            <button
              type="button"
              onClick={clearFile}
              className="shrink-0 text-sm text-muted hover:text-foreground"
            >
              Remove
            </button>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium text-foreground">Resize mode</p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setMode("custom")}
                className={[
                  "rounded border px-3 py-1.5 text-sm",
                  mode === "custom"
                    ? "border-foreground bg-foreground text-background"
                    : "border-border text-muted hover:bg-background-subtle hover:text-foreground",
                ].join(" ")}
              >
                Custom dimensions
              </button>
              <button
                type="button"
                onClick={() => setMode("percent")}
                className={[
                  "rounded border px-3 py-1.5 text-sm",
                  mode === "percent"
                    ? "border-foreground bg-foreground text-background"
                    : "border-border text-muted hover:bg-background-subtle hover:text-foreground",
                ].join(" ")}
              >
                By percentage
              </button>
            </div>
          </div>

          {mode === "percent" ? (
            <div className="space-y-3">
              <p className="text-sm font-medium text-foreground">Scale</p>
              <div className="flex flex-wrap gap-2">
                {PERCENT_PRESETS.map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setPercent(value)}
                    className={[
                      "rounded border px-2.5 py-1 text-sm",
                      percent === value
                        ? "border-foreground bg-foreground text-background"
                        : "border-border text-muted hover:bg-background-subtle hover:text-foreground",
                    ].join(" ")}
                  >
                    {value}%
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex flex-wrap items-end gap-4">
                <label className="block space-y-1">
                  <span className="text-sm font-medium text-foreground">Width</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={widthText}
                    onChange={(event) => setWidthText(event.target.value)}
                    className="block w-28 rounded border border-border bg-background px-3 py-2 text-sm"
                  />
                </label>
                <label className="block space-y-1">
                  <span className="text-sm font-medium text-foreground">Height</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={heightText}
                    onChange={(event) => setHeightText(event.target.value)}
                    className="block w-28 rounded border border-border bg-background px-3 py-2 text-sm"
                  />
                </label>
              </div>
              <label className="flex items-center gap-2 text-sm text-muted">
                <input
                  type="checkbox"
                  checked={lockAspectRatio}
                  onChange={(event) => setLockAspectRatio(event.target.checked)}
                />
                Lock aspect ratio
              </label>
            </div>
          )}

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

          {targetDimensions && (
            <p className="text-sm text-muted">
              Output size: {naturalSize.width}×{naturalSize.height} →{" "}
              {targetDimensions.width}×{targetDimensions.height}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => void handleResize()}
              disabled={phase === "processing"}
              className="rounded border border-foreground bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              {phase === "processing" ? "Resizing…" : "Resize image"}
            </button>

            {phase === "done" && result && (
              <button
                type="button"
                onClick={handleDownload}
                className="rounded border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-background-subtle"
              >
                Download
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
