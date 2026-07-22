"use client";

import Link from "next/link";
import { useTranslations } from "../lib/i18n/locale-provider";

export function SiteFooter() {
  const messages = useTranslations();

  return (
    <footer className="mt-auto px-4 pb-6 sm:px-6">
      <div className="glass-panel mx-auto flex max-w-6xl flex-col gap-3 px-6 py-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="font-[family-name:var(--font-display)] text-base text-foreground">
          Parivartan
        </p>
        <p className="text-sm text-muted">{messages.footer.privacy}</p>
        <Link
          href="/"
          className="text-sm text-faint transition-colors hover:text-foreground"
        >
          {messages.nav.allTools}
        </Link>
      </div>
    </footer>
  );
}
