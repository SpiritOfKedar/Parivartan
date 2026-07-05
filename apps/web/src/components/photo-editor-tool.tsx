"use client";

import { getTool } from "@convert-hub/conversion-rules";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import type { ImageOutputFormat } from "../lib/image-io";
import { isSupportedImage } from "../lib/image-io";
import { downloadBlob } from "../lib/merge-pdf";
import {
  DEFAULT_ADJUSTMENTS,
  exportStageToBlob,
  presetLabel,
  type FilterPreset,
  type PhotoAdjustments,
} from "../lib/photo-editor";
import type {
  EditorTool,
  PhotoEditorCanvasHandle,
} from "./photo-editor-canvas";

const PhotoEditorCanvas = dynamic(
  () =>
    import("./photo-editor-canvas").then((module) => module.PhotoEditorCanvas),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-64 items-center justify-center rounded border border-border bg-background-subtle text-sm text-muted">
        Loading editor…
      </div>
    ),
  },
);

const FILTER_PRESETS: FilterPreset[] = [
  "none",
  "grayscale",
  "sepia",
  "vintage",
  "vivid",
];

const TOOLS: { id: EditorTool; label: string }[] = [
  { id: "select", label: "Select" },
  { id: "crop", label: "Crop" },
  { id: "text", label: "Text" },
  { id: "draw", label: "Draw" },
];

function formatSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function PhotoEditorTool() {
  const inputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<PhotoEditorCanvasHandle>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [naturalSize, setNaturalSize] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const [tool, setTool] = useState<EditorTool>("select");
  const [adjustments, setAdjustments] =
    useState<PhotoAdjustments>(DEFAULT_ADJUSTMENTS);
  const [filterPreset, setFilterPreset] = useState<FilterPreset>("none");
  const [textValue, setTextValue] = useState("Your text");
  const [textColor, setTextColor] = useState("#ffffff");
  const [textSize, setTextSize] = useState(24);
  const [brushColor, setBrushColor] = useState("#ff0000");
  const [brushSize, setBrushSize] = useState(4);
  const [format, setFormat] = useState<ImageOutputFormat>("jpeg");
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toolDef = getTool("photo-editor");
  const maxBytes = toolDef?.clientMaxBytes ?? 25 * 1024 * 1024;

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
      return;
    }

    if (incoming.size > maxBytes) {
      setError(`"${incoming.name}" exceeds the ${formatSize(maxBytes)} limit.`);
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
    };
    image.src = url;

    setFile(incoming);
    setPreviewUrl(url);
    setAdjustments(DEFAULT_ADJUSTMENTS);
    setFilterPreset("none");
    setTool("select");
    setError(null);

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
    setError(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  async function handleExport() {
    const stage = editorRef.current?.getStage();
    if (!stage || !file) {
      return;
    }

    try {
      const result = await exportStageToBlob(stage, format, file.name);
      downloadBlob(result.blob, result.fileName);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Could not export this image.",
      );
    }
  }

  function updateAdjustment(key: keyof PhotoAdjustments, value: number) {
    setAdjustments((current) => ({ ...current, [key]: value }));
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
        <p className="text-[15px] text-foreground">Select an image to edit</p>
        <p className="mt-1.5 text-sm text-muted">or drag and drop here</p>
        <p className="mt-3 text-xs text-faint">
          JPEG, PNG, WebP, GIF · up to {formatSize(maxBytes)} · processed locally
        </p>
      </div>

      {file && previewUrl && naturalSize && (
        <section className="space-y-6">
          <div className="flex items-start gap-4 rounded border border-border bg-background px-4 py-3">
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

          <div className="flex flex-wrap gap-2">
            {TOOLS.map((entry) => (
              <button
                key={entry.id}
                type="button"
                onClick={() => setTool(entry.id)}
                className={[
                  "rounded border px-3 py-1.5 text-sm",
                  tool === entry.id
                    ? "border-foreground bg-foreground text-background"
                    : "border-border text-muted hover:bg-background-subtle hover:text-foreground",
                ].join(" ")}
              >
                {entry.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => editorRef.current?.undo()}
              className="rounded border border-border px-3 py-1.5 text-sm text-muted hover:bg-background-subtle hover:text-foreground"
            >
              Undo
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => editorRef.current?.rotateLeft()}
              className="rounded border border-border px-3 py-1.5 text-sm text-muted hover:bg-background-subtle hover:text-foreground"
            >
              Rotate left
            </button>
            <button
              type="button"
              onClick={() => editorRef.current?.rotateRight()}
              className="rounded border border-border px-3 py-1.5 text-sm text-muted hover:bg-background-subtle hover:text-foreground"
            >
              Rotate right
            </button>
            <button
              type="button"
              onClick={() => editorRef.current?.flipHorizontal()}
              className="rounded border border-border px-3 py-1.5 text-sm text-muted hover:bg-background-subtle hover:text-foreground"
            >
              Flip H
            </button>
            <button
              type="button"
              onClick={() => editorRef.current?.flipVertical()}
              className="rounded border border-border px-3 py-1.5 text-sm text-muted hover:bg-background-subtle hover:text-foreground"
            >
              Flip V
            </button>
            {tool === "crop" && (
              <button
                type="button"
                onClick={() => editorRef.current?.applyCrop()}
                className="rounded border border-foreground bg-foreground px-3 py-1.5 text-sm text-background"
              >
                Apply crop
              </button>
            )}
          </div>

          <PhotoEditorCanvas
            ref={editorRef}
            imageUrl={previewUrl}
            naturalWidth={naturalSize.width}
            naturalHeight={naturalSize.height}
            tool={tool}
            adjustments={adjustments}
            filterPreset={filterPreset}
            textValue={textValue}
            textColor={textColor}
            textSize={textSize}
            brushColor={brushColor}
            brushSize={brushSize}
            maxWidth={640}
          />

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <p className="text-sm font-medium text-foreground">Adjustments</p>
              {(
                [
                  ["brightness", "Brightness", -100, 100],
                  ["contrast", "Contrast", -100, 100],
                  ["saturation", "Saturation", -100, 100],
                ] as const
              ).map(([key, label, min, max]) => (
                <label key={key} className="block space-y-1 text-sm text-muted">
                  <span>
                    {label}: {adjustments[key]}
                  </span>
                  <input
                    type="range"
                    min={min}
                    max={max}
                    value={adjustments[key]}
                    onChange={(event) =>
                      updateAdjustment(key, Number(event.target.value))
                    }
                    className="w-full"
                  />
                </label>
              ))}
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">Filters</p>
                <div className="flex flex-wrap gap-2">
                  {FILTER_PRESETS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setFilterPreset(preset)}
                      className={[
                        "rounded border px-2.5 py-1 text-sm",
                        filterPreset === preset
                          ? "border-foreground bg-foreground text-background"
                          : "border-border text-muted hover:bg-background-subtle hover:text-foreground",
                      ].join(" ")}
                    >
                      {presetLabel(preset)}
                    </button>
                  ))}
                </div>
              </div>

              {tool === "text" && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground">Text</p>
                  <input
                    type="text"
                    value={textValue}
                    onChange={(event) => setTextValue(event.target.value)}
                    className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
                  />
                  <div className="flex flex-wrap items-center gap-3">
                    <input
                      type="color"
                      value={textColor}
                      onChange={(event) => setTextColor(event.target.value)}
                    />
                    <input
                      type="range"
                      min={12}
                      max={72}
                      value={textSize}
                      onChange={(event) => setTextSize(Number(event.target.value))}
                    />
                  </div>
                  <p className="text-xs text-faint">Click on the canvas to place text.</p>
                </div>
              )}

              {tool === "draw" && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground">Brush</p>
                  <div className="flex flex-wrap items-center gap-3">
                    <input
                      type="color"
                      value={brushColor}
                      onChange={(event) => setBrushColor(event.target.value)}
                    />
                    <input
                      type="range"
                      min={1}
                      max={24}
                      value={brushSize}
                      onChange={(event) => setBrushSize(Number(event.target.value))}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">Export format</p>
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
            </div>
          </div>

          <button
            type="button"
            onClick={() => void handleExport()}
            className="rounded border border-foreground bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
          >
            Download edited image
          </button>
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
