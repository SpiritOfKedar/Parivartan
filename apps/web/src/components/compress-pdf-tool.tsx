"use client";

import { useRef, useState } from "react";
import { compressPdfToTarget, type CompressQualityMode } from "../lib/compress-pdf";
import { downloadBlob } from "../lib/merge-pdf";
import { useTranslations } from "../lib/i18n/locale-provider";

type Phase = "idle" | "compressing" | "done" | "error";

const TARGET_PRESETS_KB = [100, 256, 500, 1024] as const;

function getQualityModes(messages: ReturnType<typeof useTranslations>): {
  id: CompressQualityMode;
  label: string;
  description: string;
}[] {
  return [
    {
      id: "preserve",
      label: messages.ui.keepTextSharp,
      description: messages.ui.keepTextSharpDesc,
    },
    {
      id: "balanced",
      label: messages.ui.balanced,
      description: messages.ui.balancedDesc,
    },
    {
      id: "smallest",
      label: messages.ui.smallestFile,
      description: messages.ui.smallestFileDesc,
    },
  ];
}

function formatSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isPdf(file: File): boolean {
  return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
}

function baseName(fileName: string): string {
  const dot = fileName.lastIndexOf(".");
  return dot > 0 ? fileName.slice(0, dot) : fileName;
}

export function CompressPdfTool() {
  const messages = useTranslations();
  const qualityModes = getQualityModes(messages);
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [targetKbText, setTargetKbText] = useState("256");
  const [qualityMode, setQualityMode] = useState<CompressQualityMode>("balanced");
  const [dragging, setDragging] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [resultMeta, setResultMeta] = useState<{
    originalBytes: number;
    compressedBytes: number;
    reachedTarget: boolean;
    keptOriginal: boolean;
    targetKb: number;
    textPreserved: boolean;
    method: "lossless" | "rasterize";
  } | null>(null);
  const [progressLabel, setProgressLabel] = useState<string | null>(null);

  function parseTargetKb(): number {
    const parsed = parseInt(targetKbText, 10);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function normalizeTargetKb(): number {
    let kb = parseTargetKb();
    if (kb < 1) {
      kb = 256;
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

  function selectFile(incoming: File) {
    if (!isPdf(incoming)) {
      setError(messages.ui.onlyPdfAccepted);
      setPhase("error");
      return;
    }

    setFile(incoming);
    setResultBlob(null);
    setResultMeta(null);
    setError(null);
    setPhase("idle");
    setProgressLabel(null);
  }

  function clearFile() {
    setFile(null);
    setResultBlob(null);
    setResultMeta(null);
    setError(null);
    setPhase("idle");
    setProgressLabel(null);
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

    const targetBytes = targetKb * 1024;
    if (targetBytes >= file.size) {
      setError(
        `Target (${formatSize(targetBytes)}) must be smaller than the original (${formatSize(file.size)}).`,
      );
      setPhase("error");
      return;
    }

    setPhase("compressing");
    setError(null);
    setResultBlob(null);
    setResultMeta(null);
    setProgressLabel("Loading PDF…");

    try {
      const result = await compressPdfToTarget(file, targetBytes, {
        mode: qualityMode,
        onProgress: (progress) => {
          if (progress.phase === "loading") {
            setProgressLabel("Loading PDF…");
          } else if (progress.phase === "optimizing") {
            setProgressLabel("Optimizing PDF structure (no quality loss)…");
          } else if (progress.phase === "rendering") {
            setProgressLabel(
              `Rendering page ${progress.current} of ${progress.total}…`,
            );
          } else {
            setProgressLabel("Encoding compressed PDF…");
          }
        },
      });

      const keptOriginal = result.compressedBytes >= result.originalBytes;
      const buffer = result.bytes.buffer.slice(
        result.bytes.byteOffset,
        result.bytes.byteOffset + result.bytes.byteLength,
      ) as ArrayBuffer;
      setResultBlob(new Blob([buffer], { type: "application/pdf" }));
      setResultMeta({
        originalBytes: result.originalBytes,
        compressedBytes: result.compressedBytes,
        reachedTarget: result.reachedTarget,
        keptOriginal,
        targetKb,
        textPreserved: result.textPreserved,
        method: result.method,
      });
      setPhase("done");
      setProgressLabel(null);
    } catch (cause) {
      const message =
        cause instanceof Error
          ? cause.message.includes("password") ||
              cause.message.includes("encrypted")
            ? "This PDF is password-protected. Remove the password and try again."
            : messages.ui.couldNotCompressPdf
          : messages.ui.couldNotCompressPdf;
      setError(message);
      setPhase("error");
      setProgressLabel(null);
    }
  }

  function handleDownload() {
    if (!resultBlob || !file) {
      return;
    }
    downloadBlob(resultBlob, `${baseName(file.name)}-compressed.pdf`);
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
          accept="application/pdf,.pdf"
          className="hidden"
          onChange={(event) => {
            const selected = event.target.files?.[0];
            if (selected) {
              selectFile(selected);
            }
            event.target.value = "";
          }}
        />
        <p className="text-[15px] text-foreground">{messages.common.selectPdf}</p>
        <p className="mt-1.5 text-sm text-muted">{messages.common.orDragDrop}</p>
        <p className="mt-3 text-xs text-faint">
          {messages.common.processedLocally}
        </p>
      </div>

      {file && (
        <section className="space-y-6">
          <div className="flex items-baseline justify-between gap-4 rounded border border-border bg-background px-4 py-3">
            <div className="min-w-0">
              <p className="truncate text-[15px] text-foreground">{file.name}</p>
              <p className="text-sm text-muted">Original size: {formatSize(file.size)}</p>
            </div>
            <button
              type="button"
              onClick={clearFile}
              className="shrink-0 text-sm text-muted hover:text-foreground"
            >
              {messages.common.remove}
            </button>
          </div>

          <div>
            <label htmlFor="target-kb" className="text-sm font-medium text-foreground">
              Target file size
            </label>
            <p className="mt-1 text-sm text-muted">
              Compress to at or under this size. We pick the highest quality that fits.
            </p>

            <div className="mt-4 space-y-4 rounded border border-border bg-background p-4">
              <div className="flex flex-wrap gap-2">
                {TARGET_PRESETS_KB.map((kb) => {
                  const selected = parseTargetKb() === kb;
                  return (
                    <button
                      key={kb}
                      type="button"
                      onClick={() => applyPreset(kb)}
                      className={[
                        "rounded border px-3 py-1.5 text-sm transition-colors",
                        selected
                          ? "border-foreground bg-foreground text-background"
                          : "border-border text-foreground hover:bg-background-subtle",
                      ].join(" ")}
                    >
                      {kb >= 1024 ? "1 MB" : `${kb} KB`}
                    </button>
                  );
                })}
              </div>

              <div>
                <p className="text-sm text-muted">Or enter a custom size</p>
                <div className="mt-2 flex max-w-sm items-stretch rounded border border-border bg-background focus-within:border-foreground">
                  <input
                    id="target-kb"
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    spellCheck={false}
                    value={targetKbText}
                    onChange={(event) => {
                      setTargetKbText(event.target.value.replace(/\D/g, ""));
                      setError(null);
                      if (phase === "error") {
                        setPhase("idle");
                      }
                    }}
                    onBlur={() => {
                      normalizeTargetKb();
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        normalizeTargetKb();
                        void handleCompress();
                      }
                    }}
                    placeholder="256"
                    aria-describedby="target-kb-hint"
                    className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-[15px] tabular-nums text-foreground outline-none"
                  />
                  <span className="flex items-center border-l border-border px-3 text-sm text-muted">
                    KB
                  </span>
                </div>
                <p id="target-kb-hint" className="mt-1.5 text-xs text-faint">
                  {file
                    ? `Must be less than ${formatSize(file.size)} (original file size).`
                    : messages.ui.enterSizeKb}
                </p>
              </div>
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-foreground">Compression approach</p>
            <p className="mt-1 text-sm text-muted">
              Choose how aggressively to shrink the file. Hitting a small target on
              text-heavy PDFs may require re-encoding.
            </p>
            <div className="mt-3 space-y-2">
              {qualityModes.map((mode) => (
                <label
                  key={mode.id}
                  className={[
                    "flex cursor-pointer gap-3 rounded border px-4 py-3 transition-colors",
                    qualityMode === mode.id
                      ? "border-foreground bg-background-subtle"
                      : "border-border hover:bg-background-subtle",
                  ].join(" ")}
                >
                  <input
                    type="radio"
                    name="quality-mode"
                    value={mode.id}
                    checked={qualityMode === mode.id}
                    onChange={() => setQualityMode(mode.id)}
                    className="mt-1"
                  />
                  <span>
                    <span className="text-sm font-medium text-foreground">
                      {mode.label}
                    </span>
                    <span className="mt-0.5 block text-sm text-muted">
                      {mode.description}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleCompress}
              disabled={phase === "compressing"}
              className="btn-primary"
            >
              {phase === "compressing" ? messages.ui.compressing : messages.ui.compressPdf}
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

          {phase === "compressing" && progressLabel && (
            <p className="text-sm text-muted">{progressLabel}</p>
          )}

          {phase === "done" && resultMeta && (
            <div className="rounded border border-border bg-background-subtle px-4 py-3 text-sm">
              <p className="text-foreground">
                {formatSize(resultMeta.originalBytes)} →{" "}
                <span className="font-medium">
                  {formatSize(resultMeta.compressedBytes)}
                </span>
              </p>
              {resultMeta.keptOriginal ? (
                <p className="mt-1 text-muted">
                  This PDF is already well optimized. The original was kept because
                  compression would not reduce the size.
                </p>
              ) : resultMeta.reachedTarget ? (
                <p className="mt-1 text-muted">
                  Compressed to your {formatSize(resultMeta.targetKb * 1024)} target
                  {resultMeta.textPreserved
                    ? " with text and quality preserved."
                    : " using page re-encoding."}
                </p>
              ) : resultMeta.textPreserved ? (
                <p className="mt-1 text-muted">
                  Optimized without quality loss, but could not reach{" "}
                  {formatSize(resultMeta.targetKb * 1024)}. Text-heavy PDFs like
                  marksheets rarely shrink that far without re-encoding. Try
                  Balanced mode, or raise the target.
                </p>
              ) : (
                <p className="mt-1 text-muted">
                  Could not reach {formatSize(resultMeta.targetKb * 1024)} at the
                  selected quality level. This is the best result we could achieve.
                  {qualityMode === "preserve"
                    ? " Try Balanced or Smallest file for more reduction."
                    : null}
                </p>
              )}
              {resultMeta.textPreserved ? (
                <p className="mt-2 text-xs text-faint">
                  Text remains selectable. Only PDF structure and metadata were
                  optimized.
                </p>
              ) : (
                <p className="mt-2 text-xs text-faint">
                  Pages were re-rendered to hit the target, so text may no longer be
                  selectable.
                </p>
              )}
            </div>
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
