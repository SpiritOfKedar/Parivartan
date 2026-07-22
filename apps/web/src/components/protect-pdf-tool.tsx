"use client";

import { useRef, useState } from "react";
import { downloadBlob } from "../lib/merge-pdf";
import { baseName, formatFileSize, isPdf } from "../lib/pdf-io";
import { protectPdfWithPassword } from "../lib/protect-pdf";
import { PdfToolShell } from "./pdf-tool-shell";
import { useTranslations } from "../lib/i18n/locale-provider";

type Phase = "idle" | "processing" | "done" | "error";

export function ProtectPdfTool() {
  const messages = useTranslations();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [dragging, setDragging] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);

  function selectFile(incoming: File) {
    if (!isPdf(incoming)) {
      setError(messages.ui.onlyPdfAccepted);
      setPhase("error");
      return;
    }
    setFile(incoming);
    setResultBlob(null);
    setError(null);
    setPhase("idle");
  }

  async function handleProtect() {
    if (!file) return;
    if (password.length < 4) {
      setError(messages.ui.passwordTooShort);
      setPhase("error");
      return;
    }
    if (password !== confirm) {
      setError(messages.ui.passwordsDoNotMatch);
      setPhase("error");
      return;
    }

    setPhase("processing");
    setError(null);
    setResultBlob(null);
    try {
      const bytes = await protectPdfWithPassword(file, password);
      setResultBlob(new Blob([bytes.slice()], { type: "application/pdf" }));
      setPhase("done");
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : messages.ui.couldNotProtectPdf;
      setError(message.includes("encrypted") || message.includes("password")
        ? "This PDF is already password-protected."
        : message);
      setPhase("error");
    }
  }

  return (
    <PdfToolShell
      inputRef={inputRef}
      dragging={dragging}
      setDragging={setDragging}
      onSelect={selectFile}
      file={file}
      onClear={() => { setFile(null); setPassword(""); setConfirm(""); setResultBlob(null); setError(null); setPhase("idle"); if (inputRef.current) inputRef.current.value = ""; }}
      phase={phase}
      error={error}
      actionLabel={messages.ui.protectPdf}
      processingLabel={messages.ui.encrypting}
      onAction={() => void handleProtect()}
      onDownload={() => { if (resultBlob && file) downloadBlob(resultBlob, `${baseName(file.name)}-protected.pdf`); }}
      resultReady={phase === "done" && !!resultBlob}
    >
      {file && (
        <div className="space-y-4">
          <label className="block space-y-1 text-sm">
            <span className="font-medium">{messages.ui.password}</span>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded border border-border px-3 py-2" autoComplete="new-password" />
          </label>
          <label className="block space-y-1 text-sm">
            <span className="font-medium">{messages.ui.confirmPassword}</span>
            <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className="w-full rounded border border-border px-3 py-2" autoComplete="new-password" />
          </label>
          <p className="text-xs text-faint">Password is applied locally in your browser and is not sent to our servers.</p>
        </div>
      )}
    </PdfToolShell>
  );
}
