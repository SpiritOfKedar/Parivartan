"use client";

import Link from "next/link";
import { LanguageToggle } from "./language-toggle";
import { getToolsByCategory } from "../lib/tools";
import type { CategoryId } from "../lib/category-theme";
import { useTranslations } from "../lib/i18n/locale-provider";

export function SiteHeader() {
  const messages = useTranslations();
  const categories = getToolsByCategory().map(
    (group) => group.category as CategoryId,
  );

  return (
    <header className="sticky top-0 z-50 px-4 pt-4 sm:px-6">
      <div className="glass-panel-strong mx-auto flex h-14 max-w-6xl items-center gap-4 px-4 sm:px-6">
        <Link
          href="/"
          className="shrink-0 font-[family-name:var(--font-display)] text-lg font-medium tracking-tight text-foreground"
        >
          Parivartan
        </Link>

        <nav className="ml-auto hidden items-center gap-1 md:flex">
          {categories.map((category) => (
            <Link
              key={category}
              href={`/#${category}`}
              className="rounded-lg px-3 py-1.5 text-sm text-muted transition-colors hover:bg-[var(--glass-bg)] hover:text-foreground"
            >
              {messages.categories[category].label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto md:ml-0">
          <LanguageToggle />
        </div>
      </div>
    </header>
  );
}
