"use client";

import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { tools } from "@convert-hub/conversion-rules";
import { getCategoryTheme, type CategoryId } from "../lib/category-theme";
import { formatMessage } from "../lib/i18n/get-dictionary";
import { useLocale, useTranslations } from "../lib/i18n/locale-provider";
import { CategoryIcon } from "./category-icon";

interface ToolSearchProps {
  /** Compact mode for the navbar. */
  compact?: boolean;
  className?: string;
  placeholder?: string;
}

export function ToolSearch({
  compact = false,
  className,
  placeholder,
}: ToolSearchProps) {
  const router = useRouter();
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const messages = useTranslations();
  const { locale } = useLocale();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const resolvedPlaceholder = placeholder ?? messages.nav.searchPlaceholder;

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return [];
    }

    return tools
      .map((tool) => {
        const copy = messages.tools[tool.id];
        const name = copy?.name ?? tool.name;
        const description = copy?.description ?? "";
        const categoryLabel = messages.categories[tool.category as CategoryId].label;
        const haystack =
          `${name} ${description} ${categoryLabel} ${tool.category}`.toLowerCase();
        const score =
          (name.toLowerCase().startsWith(q) ? 3 : 0) +
          (name.toLowerCase().includes(q) ? 2 : 0) +
          (haystack.includes(q) ? 1 : 0);
        return { tool, name, description, categoryLabel, score };
      })
      .filter((row) => row.score > 0)
      .sort(
        (a, b) =>
          b.score - a.score || a.name.localeCompare(b.name, locale),
      )
      .slice(0, 8);
  }, [query, messages, locale]);

  useEffect(() => {
    setActive(0);
  }, [query]);

  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, []);

  function goTo(toolId: string) {
    setOpen(false);
    setQuery("");
    router.push(`/tools/${toolId}`);
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (!open && (event.key === "ArrowDown" || event.key === "Enter")) {
      setOpen(true);
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((current) =>
        results.length === 0 ? 0 : (current + 1) % results.length,
      );
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((current) =>
        results.length === 0
          ? 0
          : (current - 1 + results.length) % results.length,
      );
    } else if (event.key === "Enter") {
      event.preventDefault();
      const match = results[active] ?? results[0];
      if (match) {
        goTo(match.tool.id);
      }
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div ref={rootRef} className={["relative", className].filter(Boolean).join(" ")}>
      <label className="relative block">
        <span className="sr-only">{messages.nav.searchTools}</span>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.75}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-faint"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="M20 20l-3.5-3.5" />
        </svg>
        <input
          type="search"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          role="combobox"
          aria-expanded={open && results.length > 0}
          aria-controls={listId}
          aria-autocomplete="list"
          placeholder={resolvedPlaceholder}
          className={[
            "w-full rounded-full border border-border bg-[rgba(255,255,255,0.04)] pl-9 pr-3 text-sm text-foreground outline-none placeholder:text-faint",
            "backdrop-blur transition-[border-color,box-shadow,background] focus:border-[color:var(--accent)] focus:bg-[rgba(255,255,255,0.07)] focus:shadow-[0_0_0_3px_var(--accent-soft)]",
            compact ? "h-9" : "h-11",
          ].join(" ")}
        />
      </label>

      {open && query.trim() && (
        <div
          id={listId}
          role="listbox"
          className="glass-panel absolute left-0 right-0 z-50 mt-2 max-h-80 overflow-auto p-1.5"
        >
          {results.length === 0 ? (
            <p className="px-3 py-3 text-sm text-muted">
              {formatMessage(messages.nav.noToolsMatch, {
                query: query.trim(),
              })}
            </p>
          ) : (
            results.map((row, index) => {
              const theme = getCategoryTheme(row.tool.category as CategoryId);
              return (
                <button
                  key={row.tool.id}
                  type="button"
                  role="option"
                  aria-selected={index === active}
                  onMouseEnter={() => setActive(index)}
                  onClick={() => goTo(row.tool.id)}
                  className={[
                    "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors",
                    index === active
                      ? "bg-[var(--accent-soft)]"
                      : "hover:bg-[rgba(255,255,255,0.04)]",
                  ].join(" ")}
                  style={{
                    ["--accent" as string]: theme.accentVar,
                    ["--accent-soft" as string]: theme.accentSoftVar,
                  }}
                >
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-border bg-[rgba(255,255,255,0.04)] p-1.5">
                    <CategoryIcon
                      category={row.tool.category as CategoryId}
                      className="size-full"
                    />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-foreground">
                      {row.name}
                    </span>
                    <span className="block truncate text-xs text-muted">
                      {row.categoryLabel} · {row.description}
                    </span>
                  </span>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
