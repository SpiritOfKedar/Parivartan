"use client";

import { useEffect, useRef, useState } from "react";
import {
  getAiProviders,
  translatePdfText,
  type AiProvider,
} from "../lib/api-client";
import { extractPdfText } from "../lib/extract-pdf-text";
import { downloadBlob } from "../lib/merge-pdf";
import { baseName, formatFileSize, isPdf } from "../lib/pdf-io";
import { PdfToolShell } from "./pdf-tool-shell";
import { useTranslations } from "../lib/i18n/locale-provider";

type Phase = "idle" | "extracting" | "processing" | "done" | "error";

const PROVIDER_LABELS: Record<AiProvider, string> = {
  gemini: "Google Gemini",
  "nvidia-nim": "NVIDIA NIM",
};

const LANGUAGES = [
  "Spanish", "French", "German", "Italian", "Portuguese",
  "Hindi", "Chinese", "Japanese", "Korean", "Arabic", "Russian",
];

export function PdfTranslateTool() {
  const messages = useTranslations();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [providers, setProviders] = useState<AiProvider[]>([]);
  const [provider, setProvider] = useState<AiProvider>("gemini");
  const [targetLanguage, setTargetLanguage] = useState("Spanish");
  const [translation, setTranslation] = useState("");
  const [modelUsed, setModelUsed] = useState("");
  const [truncated, setTruncated] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);

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
      setError(messages.ui.onlyPdfAccepted);
      setPhase("error");
      return;
    }
    setFile(incoming);
    setTranslation("");
    setModelUsed("");
    setError(null);
    setPhase("idle");
  }

  async function handleTranslate() {
    if (!file) return;
    if (providers.length === 0) {
      setError("No AI providers configured. Set GEMINI_API_KEY or NVIDIA_NIM_API_KEY in apps/api/.env");
      setPhase("error");
      return;
    }

    setPhase("extracting");
    setError(null);
    setTranslation("");

    try {
      const extracted = await extractPdfText(file);
      setTruncated(extracted.truncated);
      setPhase("processing");
      const result = await translatePdfText(extracted.text, targetLanguage, provider);
      setTranslation(result.text);
      setModelUsed(result.model);
      setPhase("done");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : messages.ui.translationFailed);
      setPhase("error");
    }
  }

  function downloadTranslation() {
    if (!translation || !file) return;
    downloadBlob(new Blob([translation], { type: "text/plain" }), `${baseName(file.name)}-${targetLanguage.toLowerCase()}.txt`);
  }

  return (
    <div className="space-y-6">
      <PdfToolShell
        inputRef={inputRef}
        dragging={dragging}
        setDragging={setDragging}
                onSelect={selectFile}
        file={file}
        onClear={() => { setFile(null); setTranslation(""); setError(null); setPhase("idle"); if (inputRef.current) inputRef.current.value = ""; }}
        phase={phase === "extracting" || phase === "processing" ? "processing" : phase === "done" ? "done" : phase === "error" ? "error" : "idle"}
        error={null}
        actionLabel={messages.ui.translatePdf}
        processingLabel={phase === "extracting" ? messages.ui.extractingText : messages.ui.translating}
        onAction={() => void handleTranslate()}
        onDownload={downloadTranslation}
        resultReady={phase === "done" && !!translation}
        downloadLabel={messages.ui.downloadTranslation}
      >
        {file && (
          <div className="flex flex-wrap gap-4">
            {providers.length > 0 && (
              <label className="space-y-1 text-sm">
                <span className="font-medium">{messages.ui.provider}</span>
                <select value={provider} onChange={(e) => setProvider(e.target.value as AiProvider)} className="block rounded border border-border px-2 py-1">
                  {providers.map((p) => (
                    <option key={p} value={p}>{PROVIDER_LABELS[p]}</option>
                  ))}
                </select>
              </label>
            )}
            <label className="space-y-1 text-sm">
              <span className="font-medium">{messages.ui.targetLanguage}</span>
              <select value={targetLanguage} onChange={(e) => setTargetLanguage(e.target.value)} className="block rounded border border-border px-2 py-1">
                {LANGUAGES.map((lang) => (
                  <option key={lang} value={lang}>{lang}</option>
                ))}
              </select>
            </label>
          </div>
        )}
        {file && providers.length === 0 && (
          <p className="text-sm text-muted">No AI providers configured on the server.</p>
        )}
      </PdfToolShell>

      {truncated && phase === "done" && (
        <p className="text-sm text-muted">Document was truncated to fit AI limits.</p>
      )}

      {translation && (
        <section className="rounded border border-border bg-background p-4">
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="text-sm font-medium">Translation ({targetLanguage})</h2>
            {modelUsed && <span className="text-xs text-faint">{modelUsed}</span>}
          </div>
          <p className="mt-3 whitespace-pre-wrap text-sm text-foreground">{translation}</p>
        </section>
      )}

      {error && <p className="text-sm text-red-400" role="alert">{error}</p>}
    </div>
  );
}
