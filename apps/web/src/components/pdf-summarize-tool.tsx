"use client";

import { getTool } from "@convert-hub/conversion-rules";
import { useEffect, useRef, useState } from "react";
import {
  getAiProviders,
  summarizePdfText,
  type AiProvider,
} from "../lib/api-client";
import { extractPdfText } from "../lib/extract-pdf-text";
import { downloadBlob } from "../lib/merge-pdf";
import { baseName, formatFileSize, isPdf } from "../lib/pdf-io";
import { PdfToolShell } from "./pdf-tool-shell";

type Phase = "idle" | "extracting" | "processing" | "done" | "error";

const PROVIDER_LABELS: Record<AiProvider, string> = {
  gemini: "Google Gemini",
  "nvidia-nim": "NVIDIA NIM",
};

export function PdfSummarizeTool() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [providers, setProviders] = useState<AiProvider[]>([]);
  const [provider, setProvider] = useState<AiProvider>("gemini");
  const [summary, setSummary] = useState("");
  const [modelUsed, setModelUsed] = useState("");
  const [truncated, setTruncated] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);

  const tool = getTool("pdf-summarize");
  const maxBytes = tool?.clientMaxBytes ?? 25 * 1024 * 1024;

  useEffect(() => {
    void getAiProviders()
      .then((list) => {
        setProviders(list);
        if (list[0]) setProvider(list[0]);
      })
      .catch(() => setProviders([]));
  }, []);

  function selectFile(incoming: File) {
    if (!isPdf(incoming)) {
      setError("Only PDF files are accepted.");
      setPhase("error");
      return;
    }
    if (incoming.size > maxBytes) {
      setError(`"${incoming.name}" exceeds the ${formatFileSize(maxBytes)} limit.`);
      setPhase("error");
      return;
    }
    setFile(incoming);
    setSummary("");
    setModelUsed("");
    setError(null);
    setPhase("idle");
  }

  async function handleSummarize() {
    if (!file) return;
    if (providers.length === 0) {
      setError("No AI providers configured. Set GEMINI_API_KEY or NVIDIA_NIM_API_KEY in apps/api/.env");
      setPhase("error");
      return;
    }

    setPhase("extracting");
    setError(null);
    setSummary("");

    try {
      const extracted = await extractPdfText(file);
      setTruncated(extracted.truncated);
      setPhase("processing");
      const result = await summarizePdfText(extracted.text, provider);
      setSummary(result.text);
      setModelUsed(result.model);
      setPhase("done");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Summarization failed.");
      setPhase("error");
    }
  }

  function downloadSummary() {
    if (!summary || !file) return;
    downloadBlob(new Blob([summary], { type: "text/plain" }), `${baseName(file.name)}-summary.txt`);
  }

  return (
    <div className="space-y-6">
      <PdfToolShell
        inputRef={inputRef}
        dragging={dragging}
        setDragging={setDragging}
        maxBytes={maxBytes}
        onSelect={selectFile}
        file={file}
        onClear={() => { setFile(null); setSummary(""); setError(null); setPhase("idle"); if (inputRef.current) inputRef.current.value = ""; }}
        phase={phase === "extracting" || phase === "processing" ? "processing" : phase === "done" ? "done" : phase === "error" ? "error" : "idle"}
        error={null}
        actionLabel="Summarize PDF"
        processingLabel={phase === "extracting" ? "Extracting text…" : "Summarizing…"}
        onAction={() => void handleSummarize()}
        onDownload={downloadSummary}
        resultReady={phase === "done" && !!summary}
        downloadLabel="Download summary"
      >
        {file && providers.length > 0 && (
          <label className="block space-y-1 text-sm">
            <span className="font-medium">AI provider</span>
            <select value={provider} onChange={(e) => setProvider(e.target.value as AiProvider)} className="rounded border border-border px-2 py-1">
              {providers.map((p) => (
                <option key={p} value={p}>{PROVIDER_LABELS[p]}</option>
              ))}
            </select>
          </label>
        )}
        {file && providers.length === 0 && (
          <p className="text-sm text-muted">No AI providers configured on the server.</p>
        )}
      </PdfToolShell>

      {truncated && phase === "done" && (
        <p className="text-sm text-muted">Document was truncated to fit AI limits.</p>
      )}

      {summary && (
        <section className="rounded border border-border bg-background p-4">
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="text-sm font-medium">Summary</h2>
            {modelUsed && <span className="text-xs text-faint">{modelUsed}</span>}
          </div>
          <p className="mt-3 whitespace-pre-wrap text-sm text-foreground">{summary}</p>
        </section>
      )}

      {error && <p className="text-sm text-red-700" role="alert">{error}</p>}
    </div>
  );
}
