"use client";

import Link from "next/link";
import { useTranslations } from "../../../lib/i18n/locale-provider";

export default function ToolNotFound() {
  const messages = useTranslations();

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-16">
      <h1 className="text-xl font-semibold">{messages.common.toolMissingTitle}</h1>
      <p className="mt-2 text-[15px] text-muted">
        {messages.common.toolMissingBody}
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex items-center rounded border border-border px-3 py-1.5 text-sm text-foreground transition-colors hover:bg-background-subtle"
      >
        ← {messages.common.backToTools}
      </Link>
    </main>
  );
}
