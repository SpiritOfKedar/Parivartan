"use client";

import Link from "next/link";
import { useTranslations } from "../lib/i18n/locale-provider";

export function SiteFooter() {
  const messages = useTranslations();

  return (
    <footer className="mt-auto w-full min-w-0 px-3 pb-5 sm:px-6 sm:pb-6">
      <div className="glass-liquid mx-auto flex w-full max-w-6xl min-w-0 flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-6 sm:py-5">
        <p className="font-[family-name:var(--font-display)] text-base text-white">
          Parivartan
        </p>
        <p className="text-sm leading-relaxed text-white/70 sm:text-center">
          {messages.footer.privacy}
        </p>
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
