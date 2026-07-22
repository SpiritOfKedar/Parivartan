"use client";

import { useEffect, useRef, useState } from "react";
import { isSupportedImage } from "../lib/image-io";
import { generateMeme } from "../lib/meme-generator";
import { downloadBlob } from "../lib/merge-pdf";
import { useTranslations } from "../lib/i18n/locale-provider";

type Phase = "idle" | "processing" | "done" | "error";

function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function MemeGeneratorTool() {
  const messages = useTranslations();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [topText, setTopText] = useState("");
  const [bottomText, setBottomText] = useState("");
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
    setResultBlob(null);
    setResultName(null);
    setError(null);
    setPhase("idle");
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  async function handleGenerate() {
    if (!file) {
      return;
    }
    if (!topText.trim() && !bottomText.trim()) {
      setError(messages.ui.enterCaption);
      setPhase("error");
      return;
    }

    setPhase("processing");
    setError(null);

    try {
      const output = await generateMeme(file, { topText, bottomText });
      setResultBlob(output.blob);
      setResultName(output.fileName);
      setPhase("done");
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : messages.ui.couldNotCreateMeme,
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
            <span className="text-sm font-medium text-foreground">{messages.ui.topCaption}</span>
            <input
              type="text"
              value={topText}
              onChange={(event) => setTopText(event.target.value)}
              className="block w-full rounded border border-border bg-background px-3 py-2 text-sm"
              placeholder="TOP TEXT"
            />
          </label>

          <label className="block space-y-1">
            <span className="text-sm font-medium text-foreground">
              {messages.ui.bottomCaption}
            </span>
            <input
              type="text"
              value={bottomText}
              onChange={(event) => setBottomText(event.target.value)}
              className="block w-full rounded border border-border bg-background px-3 py-2 text-sm"
              placeholder="BOTTOM TEXT"
            />
          </label>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => void handleGenerate()}
              disabled={phase === "processing"}
              className="btn-primary"
            >
              {phase === "processing" ? messages.ui.creating : messages.ui.createMeme}
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
