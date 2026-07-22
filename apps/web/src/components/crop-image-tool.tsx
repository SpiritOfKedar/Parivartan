"use client";

import { useEffect, useRef, useState } from "react";
import {
  cropImage,
  normalizeCropRect,
  type CropRect,
} from "../lib/crop-image";
import { isSupportedImage, type ImageOutputFormat } from "../lib/image-io";
import { downloadBlob } from "../lib/merge-pdf";
import { useTranslations } from "../lib/i18n/locale-provider";

type Phase = "idle" | "processing" | "done" | "error";

function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function CropImageTool() {
  const messages = useTranslations();
  const inputRef = useRef<HTMLInputElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    mode: "move" | "br";
    startX: number;
    startY: number;
    origin: CropRect;
  } | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [naturalSize, setNaturalSize] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const [displaySize, setDisplaySize] = useState({ width: 0, height: 0 });
  const [crop, setCrop] = useState<CropRect | null>(null);
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

  useEffect(() => {
    function onMove(event: PointerEvent) {
      if (!dragRef.current || !naturalSize || !crop) {
        return;
      }
      const scale = naturalSize.width / displaySize.width;
      const dx = (event.clientX - dragRef.current.startX) * scale;
      const dy = (event.clientY - dragRef.current.startY) * scale;
      const origin = dragRef.current.origin;

      if (dragRef.current.mode === "move") {
        setCrop(
          normalizeCropRect(naturalSize.width, naturalSize.height, {
            x: origin.x + dx,
            y: origin.y + dy,
            width: origin.width,
            height: origin.height,
          }),
        );
      } else {
        setCrop(
          normalizeCropRect(naturalSize.width, naturalSize.height, {
            x: origin.x,
            y: origin.y,
            width: origin.width + dx,
            height: origin.height + dy,
          }),
        );
      }
    }

    function onUp() {
      dragRef.current = null;
    }

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [crop, displaySize.width, naturalSize]);

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
    const url = URL.createObjectURL(incoming);
    const image = new Image();
    image.onload = () => {
      const width = image.naturalWidth;
      const height = image.naturalHeight;
      setNaturalSize({ width, height });
      setCrop({
        x: Math.round(width * 0.1),
        y: Math.round(height * 0.1),
        width: Math.round(width * 0.8),
        height: Math.round(height * 0.8),
      });
    };
    image.src = url;

    setFile(incoming);
    setPreviewUrl(url);
    setResultBlob(null);
    setResultName(null);
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
    setCrop(null);
    setResultBlob(null);
    setResultName(null);
    setError(null);
    setPhase("idle");
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  async function handleCrop() {
    if (!file || !crop || !naturalSize) {
      return;
    }

    setPhase("processing");
    setError(null);
    setResultBlob(null);

    try {
      const output = await cropImage(file, crop, format);
      setResultBlob(output.blob);
      setResultName(output.fileName);
      setPhase("done");
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : messages.ui.couldNotCropImage,
      );
      setPhase("error");
    }
  }

  const scale =
    naturalSize && displaySize.width > 0
      ? displaySize.width / naturalSize.width
      : 1;

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

      {file && naturalSize && crop && previewUrl && (
        <section className="space-y-6">
          <div className="flex items-start gap-4 rounded border border-border bg-background px-4 py-3">
            <img
              src={previewUrl}
              alt={file.name}
              className="h-16 w-16 shrink-0 rounded border border-border object-cover"
            />
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
              {messages.common.remove}
            </button>
          </div>

          <div
            ref={stageRef}
            className="relative mx-auto max-w-full overflow-hidden rounded border border-border bg-background-subtle"
          >
            <img
              src={previewUrl}
              alt=""
              className="block max-h-[420px] w-full object-contain"
              onLoad={(event) => {
                const el = event.currentTarget;
                setDisplaySize({
                  width: el.clientWidth,
                  height: el.clientHeight,
                });
              }}
              draggable={false}
            />
            {displaySize.width > 0 && (
              <div
                className="absolute border-2 border-foreground bg-foreground/10"
                style={{
                  left: crop.x * scale,
                  top: crop.y * scale,
                  width: crop.width * scale,
                  height: crop.height * scale,
                }}
                onPointerDown={(event) => {
                  event.preventDefault();
                  dragRef.current = {
                    mode: "move",
                    startX: event.clientX,
                    startY: event.clientY,
                    origin: crop,
                  };
                }}
              >
                <button
                  type="button"
                  aria-label="Resize crop"
                  className="absolute -bottom-1.5 -right-1.5 h-3.5 w-3.5 rounded-sm border border-foreground bg-background"
                  onPointerDown={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    dragRef.current = {
                      mode: "br",
                      startX: event.clientX,
                      startY: event.clientY,
                      origin: crop,
                    };
                  }}
                />
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-end gap-4">
            {(["x", "y", "width", "height"] as const).map((key) => (
              <label key={key} className="block space-y-1">
                <span className="text-sm font-medium capitalize text-foreground">
                  {key}
                </span>
                <input
                  type="number"
                  value={crop[key]}
                  onChange={(event) => {
                    const value = parseInt(event.target.value, 10);
                    if (!Number.isFinite(value) || !naturalSize) {
                      return;
                    }
                    setCrop(
                      normalizeCropRect(naturalSize.width, naturalSize.height, {
                        ...crop,
                        [key]: value,
                      }),
                    );
                  }}
                  className="block w-24 rounded border border-border bg-background px-3 py-2 text-sm"
                />
              </label>
            ))}
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">{messages.ui.format}</p>
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

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => void handleCrop()}
              disabled={phase === "processing"}
              className="btn-primary"
            >
              {phase === "processing" ? messages.ui.cropping : messages.ui.cropImage}
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
