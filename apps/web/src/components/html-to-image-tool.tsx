"use client";

import { useState } from "react";
import { htmlToImage } from "../lib/html-to-image";
import type { ImageOutputFormat } from "../lib/image-io";
import { downloadBlob } from "../lib/merge-pdf";
import { useTranslations } from "../lib/i18n/locale-provider";

type Phase = "idle" | "processing" | "done" | "error";

const DEFAULT_HTML = `<div style="padding:48px;font-family:Georgia,serif;background:linear-gradient(135deg,#f8fafc,#e2e8f0);height:100%;box-sizing:border-box">
  <h1 style="margin:0 0 12px;font-size:42px">Hello</h1>
  <p style="margin:0;font-size:18px;color:#334155">Paste your HTML and export an image.</p>
</div>`;

export function HtmlToImageTool() {
  const messages = useTranslations();
  const [html, setHtml] = useState(DEFAULT_HTML);
  const [width, setWidth] = useState(800);
  const [height, setHeight] = useState(450);
  const [format, setFormat] = useState<ImageOutputFormat>("png");
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [resultName, setResultName] = useState<string | null>(null);

  async function handleConvert() {
    setPhase("processing");
    setError(null);
    setResultBlob(null);

    try {
      const output = await htmlToImage({
        html,
        width,
        height,
        format,
      });
      setResultBlob(output.blob);
      setResultName(output.fileName);
      setPhase("done");
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : messages.ui.couldNotConvertHtml,
      );
      setPhase("error");
    }
  }

  return (
    <div className="space-y-6">
      <label className="block space-y-1">
        <span className="text-sm font-medium text-foreground">{messages.ui.htmlMarkup}</span>
        <textarea
          value={html}
          onChange={(event) => setHtml(event.target.value)}
          rows={12}
          className="block w-full rounded border border-border bg-background px-3 py-2 font-mono text-sm"
        />
      </label>

      <div className="flex flex-wrap items-end gap-4">
        <label className="block space-y-1">
          <span className="text-sm font-medium text-foreground">{messages.ui.width}</span>
          <input
            type="number"
            min={1}
            value={width}
            onChange={(event) => setWidth(Number(event.target.value) || 1)}
            className="block w-28 rounded border border-border bg-background px-3 py-2 text-sm"
          />
        </label>
        <label className="block space-y-1">
          <span className="text-sm font-medium text-foreground">{messages.ui.height}</span>
          <input
            type="number"
            min={1}
            value={height}
            onChange={(event) => setHeight(Number(event.target.value) || 1)}
            className="block w-28 rounded border border-border bg-background px-3 py-2 text-sm"
          />
        </label>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium text-foreground">{messages.ui.format}</p>
        <div className="flex flex-wrap gap-2">
          {(["png", "jpeg", "webp"] as const).map((value) => (
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
          onClick={() => void handleConvert()}
          disabled={phase === "processing"}
          className="btn-primary"
        >
          {phase === "processing" ? messages.common.converting : messages.ui.convertToImage}
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

      {error && (
        <p className="text-sm text-red-400" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
