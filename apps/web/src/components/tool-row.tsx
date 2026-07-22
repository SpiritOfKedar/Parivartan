"use client";

import Link from "next/link";
import type { ToolDefinition } from "@convert-hub/shared";
import type { CategoryLayout } from "../lib/category-theme";
import { useTranslations } from "../lib/i18n/locale-provider";

interface ToolLinkProps {
  tool: ToolDefinition;
  layout: CategoryLayout;
}

function Arrow() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-4 shrink-0 transition-transform duration-200 group-hover:translate-x-0.5"
      aria-hidden="true"
    >
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

export function ToolLink({ tool, layout }: ToolLinkProps) {
  const messages = useTranslations();
  const href = `/tools/${tool.id}`;
  const name = messages.tools[tool.id]?.name ?? tool.name;
  const description =
    messages.tools[tool.id]?.description ?? "Convert your file.";

  if (layout === "ledger") {
    return (
      <Link
        href={href}
        className="group relative flex h-full flex-col justify-between overflow-hidden rounded-2xl border border-white/12 bg-black/55 p-5 backdrop-blur-xl transition-all duration-200 hover:-translate-y-0.5 hover:border-[color:var(--accent)] hover:bg-black/65 hover:accent-glow"
      >
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-px"
          style={{
            background:
              "linear-gradient(90deg, transparent, var(--accent), transparent)",
          }}
          aria-hidden="true"
        />
        <div>
          <div className="flex items-start justify-between gap-3">
            <p className="text-[15px] font-medium text-foreground">{name}</p>
            <span
              className="mt-0.5 text-[color:var(--accent)] opacity-70 transition-opacity group-hover:opacity-100"
              aria-hidden="true"
            >
              <Arrow />
            </span>
          </div>
          <p className="mt-2 text-sm leading-snug text-muted">{description}</p>
        </div>
        <span className="mt-4 text-xs font-medium uppercase tracking-[0.14em] text-faint transition-colors group-hover:text-[color:var(--accent)]">
          {messages.common.open}
        </span>
      </Link>
    );
  }

  if (layout === "waveform") {
    return (
      <Link
        href={href}
        className="group flex items-center gap-4 rounded-xl border border-white/12 bg-black/55 px-5 py-4 backdrop-blur-xl transition-all duration-200 hover:-translate-y-0.5 hover:border-[color:var(--accent)] hover:bg-black/65"
      >
        <svg
          viewBox="0 0 48 24"
          className="h-6 w-12 shrink-0 text-[color:var(--accent)]"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          aria-hidden="true"
        >
          <path d="M3 12v0M9 8v8M15 4v16M21 9v6M27 6v12M33 3v18M39 8v8M45 11v2" />
        </svg>
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-medium text-foreground">{name}</p>
          <p className="mt-0.5 truncate text-sm text-muted">{description}</p>
        </div>
        <span className="text-[color:var(--accent)]" aria-hidden="true">
          <Arrow />
        </span>
      </Link>
    );
  }

  if (layout === "cinema") {
    return (
      <Link
        href={href}
        className="group relative flex aspect-video flex-col justify-end overflow-hidden rounded-2xl border border-white/12 bg-black/55 p-5 backdrop-blur-xl transition-all duration-200 hover:-translate-y-0.5 hover:border-[color:var(--accent)] hover:accent-glow"
      >
        <div
          className="absolute inset-0 opacity-60"
          style={{
            background:
              "radial-gradient(90% 80% at 80% 10%, var(--accent-soft), transparent 60%)",
          }}
          aria-hidden="true"
        />
        <div className="relative">
          <p className="text-lg font-medium text-foreground">{name}</p>
          <p className="mt-1 text-sm text-muted">{description}</p>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-white/12 bg-black/55 p-5 backdrop-blur-xl transition-all duration-200 hover:-translate-y-1 hover:border-[color:var(--accent)] hover:accent-glow"
    >
      <div
        className="pointer-events-none absolute -right-8 -top-8 size-24 rounded-full opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-100"
        style={{ background: "var(--accent-soft)" }}
        aria-hidden="true"
      />
      <div className="relative">
        <p className="text-[15px] font-medium text-foreground">{name}</p>
        <p className="mt-1 text-sm leading-snug text-muted">{description}</p>
      </div>
      <span
        className="relative mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-[color:var(--accent)]"
        aria-hidden="true"
      >
        {messages.common.open}
        <Arrow />
      </span>
    </Link>
  );
}
