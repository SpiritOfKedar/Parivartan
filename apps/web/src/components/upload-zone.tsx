"use client";

import { useRef, useState } from "react";
import { useTranslations } from "../lib/i18n/locale-provider";

interface UploadZoneProps {
  accept?: string;
  multiple?: boolean;
  label: string;
}

export function UploadZone({ accept, multiple, label }: UploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const messages = useTranslations();

  return (
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
      }}
      data-dragging={dragging}
      className="glass-dropzone cursor-pointer px-6 py-16 text-center"
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        onChange={() => {
          /* wired up in a later phase */
        }}
      />
      <p className="text-[15px] text-foreground">{label}</p>
      <p className="mt-1.5 text-sm text-muted">{messages.common.orDragDrop}</p>
    </div>
  );
}
