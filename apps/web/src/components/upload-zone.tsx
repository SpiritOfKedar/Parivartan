"use client";

import { useRef, useState } from "react";

interface UploadZoneProps {
  accept?: string;
  multiple?: boolean;
  label: string;
}

export function UploadZone({ accept, multiple, label }: UploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

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
      className={[
        "cursor-pointer rounded border border-dashed px-6 py-16 text-center transition-colors",
        dragging
          ? "border-border-strong bg-background-subtle"
          : "border-border hover:border-border-strong hover:bg-background-subtle",
      ].join(" ")}
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
      <p className="mt-1.5 text-sm text-muted">or drag and drop here</p>
    </div>
  );
}
