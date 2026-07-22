"use client";

import { useLocale } from "../lib/i18n/locale-provider";

export function LanguageToggle() {
  const { locale, setLocale, messages } = useLocale();

  return (
    <div
      role="group"
      aria-label={messages.nav.language}
      className="flex shrink-0 items-center rounded-full border border-white/20 bg-black/25 p-0.5 text-xs font-medium"
    >
      <button
        type="button"
        onClick={() => setLocale("en")}
        aria-pressed={locale === "en"}
        className={`rounded-full px-2.5 py-1 transition-colors ${
          locale === "en"
            ? "bg-white/20 text-white"
            : "text-white/65 hover:text-white"
        }`}
      >
        {messages.nav.english}
      </button>
      <button
        type="button"
        onClick={() => setLocale("mr")}
        aria-pressed={locale === "mr"}
        className={`rounded-full px-2.5 py-1 transition-colors ${
          locale === "mr"
            ? "bg-white/20 text-white"
            : "text-white/65 hover:text-white"
        }`}
      >
        {messages.nav.marathi}
      </button>
    </div>
  );
}
