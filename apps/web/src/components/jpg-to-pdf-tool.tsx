"use client";

import { useEffect, useRef, useState } from "react";
import { imagesToPdf, isSupportedImage } from "../lib/jpg-to-pdf";
import { downloadBlob } from "../lib/merge-pdf";
import { useTranslations } from "../lib/i18n/locale-provider";

type Phase = "idle" | "building" | "done" | "error";

interface ImageEntry {
  id: string;
  file: File;
  previewUrl: string;
}

function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function totalBytes(entries: ImageEntry[]): number {
  return entries.reduce((sum, entry) => sum + entry.file.size, 0);
}

export function JpgToPdfTool() {
  const messages = useTranslations();
  const inputRef = useRef<HTMLInputElement>(null);
  const [entries, setEntries] = useState<ImageEntry[]>([]);
  const [dragging, setDragging] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);

  useEffect(() => {
    return () => {
      for (const entry of entries) {
        URL.revokeObjectURL(entry.previewUrl);
      }
    };
  }, [entries]);

  function addFiles(incoming: FileList | File[]) {
    const list = Array.from(incoming);
    const images = list.filter(isSupportedImage);
    const rejected = list.length - images.length;

    if (rejected > 0) {
      setError(messages.ui.onlyImagesAccepted);
      setPhase("error");
    } else {
      setError(null);
      if (phase === "error") {
        setPhase("idle");
      }
    }

    if (images.length === 0) {
      return;
    }

    const newEntries = images.map((file) => ({
      id: crypto.randomUUID(),
      file,
      previewUrl: URL.createObjectURL(file),
    }));

    setEntries([...entries, ...newEntries]);
    setResultBlob(null);
    if (phase === "done") {
      setPhase("idle");
    }
  }

  function removeEntry(index: number) {
    setEntries((current) => {
      const entry = current[index];
      if (entry) {
        URL.revokeObjectURL(entry.previewUrl);
      }
      return current.filter((_, i) => i !== index);
    });
    setResultBlob(null);
    setPhase("idle");
    setError(null);
  }

  function moveEntry(index: number, direction: -1 | 1) {
    const next = index + direction;
    if (next < 0 || next >= entries.length) {
      return;
    }
    setEntries((current) => {
      const copy = [...current];
      [copy[index], copy[next]] = [copy[next]!, copy[index]!];
      return copy;
    });
    setResultBlob(null);
    setPhase("idle");
  }

  function reorderEntries(fromIndex: number, toIndex: number) {
    if (fromIndex === toIndex) {
      return;
    }
    setEntries((current) => {
      const copy = [...current];
      const [moved] = copy.splice(fromIndex, 1);
      if (!moved) {
        return current;
      }
      copy.splice(toIndex, 0, moved);
      return copy;
    });
    setResultBlob(null);
    setPhase("idle");
  }

  function clearAll() {
    for (const entry of entries) {
      URL.revokeObjectURL(entry.previewUrl);
    }
    setEntries([]);
    setResultBlob(null);
    setError(null);
    setPhase("idle");
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  async function handleCreate() {
    if (entries.length === 0) {
      setError(messages.ui.addAtLeastOneImage);
      setPhase("error");
      return;
    }

    setPhase("building");
    setError(null);
    setResultBlob(null);

    try {
      const bytes = await imagesToPdf(entries.map((entry) => entry.file));
      setResultBlob(new Blob([bytes.slice()], { type: "application/pdf" }));
      setPhase("done");
    } catch (cause) {
      const message =
        cause instanceof Error ? cause.message : messages.ui.couldNotCreatePdf;
      setError(message);
      setPhase("error");
    }
  }

  function handleDownload() {
    if (!resultBlob) {
      return;
    }
    const baseName = entries[0]?.file.name.replace(/\.[^.]+$/, "") ?? "images";
    downloadBlob(resultBlob, `${baseName}-combined.pdf`);
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
            addFiles(event.dataTransfer.files);
          }
        }}
        data-dragging={dragging}
        className="glass-dropzone cursor-pointer px-6 py-12 text-center"
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
          multiple
          className="hidden"
          onChange={(event) => {
            if (event.target.files?.length) {
              addFiles(event.target.files);
              event.target.value = "";
            }
          }}
        />
        <p className="text-[15px] text-foreground">{messages.common.selectImages}</p>
        <p className="mt-1.5 text-sm text-muted">{messages.common.orDragDrop}</p>
        <p className="mt-3 text-xs text-faint">
          JPEG, PNG, WebP · processed locally
        </p>
      </div>

      {entries.length > 0 && (
        <section>
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="text-sm font-medium text-foreground">
              {entries.length} image{entries.length === 1 ? "" : "s"} ·{" "}
              {formatSize(totalBytes(entries))}
            </h2>
            <button
              type="button"
              onClick={clearAll}
              className="text-sm text-muted hover:text-foreground"
            >
              Clear all
            </button>
          </div>

          <p className="mt-2 text-sm text-muted">
            Drag thumbnails to reorder pages, or use the arrow buttons.
          </p>

          <ol className="mt-3 divide-y divide-border rounded border border-border bg-background">
            {entries.map((entry, index) => (
              <li
                key={entry.id}
                draggable
                onDragStart={() => setDragIndex(index)}
                onDragOver={(event) => {
                  event.preventDefault();
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  if (dragIndex !== null) {
                    reorderEntries(dragIndex, index);
                  }
                  setDragIndex(null);
                }}
                onDragEnd={() => setDragIndex(null)}
                className={[
                  "flex items-center gap-3 px-4 py-3",
                  dragIndex === index ? "bg-background-subtle" : "",
                ].join(" ")}
              >
                <span className="w-5 shrink-0 cursor-grab text-sm tabular-nums text-faint">
                  {index + 1}
                </span>
                <img
                  src={entry.previewUrl}
                  alt={entry.file.name}
                  className="h-14 w-14 shrink-0 rounded border border-border object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] text-foreground">
                    {entry.file.name}
                  </p>
                  <p className="text-sm text-muted">{formatSize(entry.file.size)}</p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    aria-label={`Move ${entry.file.name} up`}
                    disabled={index === 0}
                    onClick={() => moveEntry(index, -1)}
                    className="px-2 py-1 text-sm text-muted hover:text-foreground disabled:opacity-30"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    aria-label={`Move ${entry.file.name} down`}
                    disabled={index === entries.length - 1}
                    onClick={() => moveEntry(index, 1)}
                    className="px-2 py-1 text-sm text-muted hover:text-foreground disabled:opacity-30"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => removeEntry(index)}
                    className="px-2 py-1 text-sm text-muted hover:text-foreground"
                  >
                    {messages.common.remove}
                  </button>
                </div>
              </li>
            ))}
          </ol>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => void handleCreate()}
              disabled={phase === "building"}
              className="btn-primary"
            >
              {phase === "building" ? messages.ui.creatingPdf : messages.ui.createPdf}
            </button>

            {phase === "done" && resultBlob && (
              <button
                type="button"
                onClick={handleDownload}
                className="btn-ghost"
              >
                {messages.common.downloadPdf}
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
