"use client";

import Link from "next/link";
import { useEffect, useId, useState } from "react";
import { CategoryIcon } from "./category-icon";
import { getToolsByCategory, tools } from "../lib/tools";
import type { CategoryId } from "../lib/category-theme";
import { getCategoryTheme } from "../lib/category-theme";
import { navMenuByCategory } from "../lib/nav-menu";
import { useTranslations } from "../lib/i18n/locale-provider";

interface MobileNavProps {
  categories: CategoryId[];
}

export function MobileNav({ categories }: MobileNavProps) {
  const messages = useTranslations();
  const titleId = useId();
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<CategoryId | null>(categories[0] ?? null);
  const groups = getToolsByCategory();

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={titleId}
        aria-label={open ? messages.nav.closeMenu : messages.nav.openMenu}
        onClick={() => setOpen((value) => !value)}
        className="flex size-9 items-center justify-center rounded-full border border-white/25 bg-white/10 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]"
      >
        {open ? (
          <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
            <path
              d="M6 6l12 12M18 6L6 18"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
            />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
            <path
              d="M4 7h16M4 12h16M4 17h16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
            />
          </svg>
        )}
      </button>

      {open ? (
        <div className="fixed inset-0 z-[60] lg:hidden" role="dialog" aria-modal="true" aria-labelledby={titleId}>
          <button
            type="button"
            aria-label={messages.nav.closeMenu}
            className="absolute inset-0 bg-black/55 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          <div className="glass-liquid absolute inset-x-3 top-[4.5rem] bottom-3 flex flex-col overflow-hidden sm:inset-x-4">
            <div className="flex items-center justify-between border-b border-white/12 px-4 py-3">
              <p id={titleId} className="text-sm font-semibold text-white">
                {messages.nav.allTools}
              </p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full px-3 py-1.5 text-xs font-medium text-white/70 hover:bg-white/10 hover:text-white"
              >
                {messages.nav.closeMenu}
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 py-2">
              {groups.map((group) => {
                const category = group.category as CategoryId;
                const theme = getCategoryTheme(category);
                const isOpen = expanded === category;
                const columns = navMenuByCategory[category];
                const toolIds = columns.flatMap((column) => column.toolIds);
                const categoryTools = toolIds
                  .map((id) => tools.find((tool) => tool.id === id))
                  .filter(Boolean);

                return (
                  <div
                    key={category}
                    className="mb-1 overflow-hidden rounded-2xl"
                    style={{
                      ["--accent" as string]: theme.accentVar,
                      ["--accent-soft" as string]: theme.accentSoftVar,
                    }}
                  >
                    <div className="flex items-center gap-1">
                      <Link
                        href={`/#${category}`}
                        onClick={() => setOpen(false)}
                        className="flex min-w-0 flex-1 items-center gap-3 rounded-2xl px-3 py-3 text-left hover:bg-white/8"
                      >
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/10 p-1.5">
                          <CategoryIcon category={category} className="size-full" />
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-semibold text-white">
                            {messages.categories[category].label}
                          </span>
                          <span className="block truncate text-xs text-white/50">
                            {messages.categories[category].tagline}
                          </span>
                        </span>
                      </Link>
                      <button
                        type="button"
                        aria-expanded={isOpen}
                        aria-label={messages.categories[category].label}
                        onClick={() =>
                          setExpanded((current) =>
                            current === category ? null : category,
                          )
                        }
                        className="mr-1 flex size-9 shrink-0 items-center justify-center rounded-full text-white/70 hover:bg-white/10 hover:text-white"
                      >
                        <svg
                          viewBox="0 0 12 12"
                          className={[
                            "size-3 transition-transform",
                            isOpen ? "rotate-180" : "",
                          ].join(" ")}
                          aria-hidden="true"
                        >
                          <path
                            d="M2.5 4.5L6 8l3.5-3.5"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </button>
                    </div>

                    {isOpen ? (
                      <ul className="space-y-0.5 px-2 pb-3">
                        {categoryTools.map((tool) => {
                          if (!tool) return null;
                          const name =
                            messages.tools[tool.id]?.name ?? tool.name;
                          return (
                            <li key={tool.id}>
                              <Link
                                href={`/tools/${tool.id}`}
                                onClick={() => setOpen(false)}
                                className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-white/90 hover:bg-white/10 hover:text-white"
                              >
                                <span className="size-1.5 rounded-full bg-[color:var(--accent)]" />
                                {name}
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
