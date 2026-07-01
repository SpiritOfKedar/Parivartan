"use client";

import { getTool } from "@convert-hub/conversion-rules";
import { useRef, useState } from "react";
import { downloadBlob } from "../lib/merge-pdf";
import { baseName, formatFileSize, isPdf } from "../lib/pdf-io";
import { protectPdfWithPassword } from "../lib/protect-pdf";
import { PdfToolShell } from "./pdf-tool-shell";

type Phase = "idle" | "processing" | "done" | "error";

export function ProtectPdfTool() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [dragging, setDragging] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);

  const tool = getTool("protect-pdf");
  const maxBytes = tool?.clientMaxBytes ?? 25 * 1024 * 1024;

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
    setResultBlob(null);
    setError(null);
    setPhase("idle");
  }

  async function handleProtect() {
    if (!file) return;
    if (password.length < 4) {
      setError("Password must be at least 4 characters.");
      setPhase("error");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
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
      const message = cause instanceof Error ? cause.message : "Could not protect PDF.";
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
      maxBytes={maxBytes}
      onSelect={selectFile}
      file={file}
      onClear={() => { setFile(null); setPassword(""); setConfirm(""); setResultBlob(null); setError(null); setPhase("idle"); if (inputRef.current) inputRef.current.value = ""; }}
      phase={phase}
      error={error}
      actionLabel="Protect PDF"
      processingLabel="Encrypting…"
      onAction={() => void handleProtect()}
      onDownload={() => { if (resultBlob && file) downloadBlob(resultBlob, `${baseName(file.name)}-protected.pdf`); }}
      resultReady={phase === "done" && !!resultBlob}
    >
      {file && (
        <div className="space-y-4">
          <label className="block space-y-1 text-sm">
            <span className="font-medium">Password</span>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded border border-border px-3 py-2" autoComplete="new-password" />
          </label>
          <label className="block space-y-1 text-sm">
            <span className="font-medium">Confirm password</span>
            <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className="w-full rounded border border-border px-3 py-2" autoComplete="new-password" />
          </label>
          <p className="text-xs text-faint">Password is applied locally in your browser and is not sent to our servers.</p>
        </div>
      )}
    </PdfToolShell>
  );
}
