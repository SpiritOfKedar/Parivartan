"use client";

import Link from "next/link";
import { useTranslations } from "../lib/i18n/locale-provider";

export function SiteFooter() {
  const messages = useTranslations();

  return (
    <footer className="mt-auto px-4 pb-6 sm:px-6">
      <div className="glass-liquid mx-auto flex max-w-6xl flex-col gap-3 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="font-[family-name:var(--font-display)] text-base text-white">
          Parivartan
        </p>
        <p className="text-sm text-white/70">{messages.footer.privacy}</p>
        <Link
          href="/"
          className="text-sm text-white/55 transition-colors hover:text-white"
        >
          {messages.nav.allTools}
        </Link>
      </div>
    </footer>
  );
}
