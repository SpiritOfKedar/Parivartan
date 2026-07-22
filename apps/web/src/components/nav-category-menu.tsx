"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { CategoryIcon } from "./category-icon";
import type { CategoryId } from "../lib/category-theme";
import { getCategoryTheme } from "../lib/category-theme";
import { navMenuByCategory } from "../lib/nav-menu";
import { useTranslations } from "../lib/i18n/locale-provider";

interface NavCategoryMenuProps {
  category: CategoryId;
  /** Align panel to avoid clipping at the viewport edge. */
  align?: "start" | "center" | "end";
}

export function NavCategoryMenu({
  category,
  align = "center",
}: NavCategoryMenuProps) {
  const messages = useTranslations();
  const theme = getCategoryTheme(category);
  const columns = navMenuByCategory[category];
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [open, setOpen] = useState(false);

  function clearCloseTimer() {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }

  function openMenu() {
    clearCloseTimer();
    setOpen(true);
  }

  function scheduleClose() {
    clearCloseTimer();
    closeTimer.current = setTimeout(() => setOpen(false), 160);
  }

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("pointerdown", onPointerDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("pointerdown", onPointerDown);
      clearCloseTimer();
    };
  }, []);

  const label = messages.categories[category].label;
  const columnCount = Math.max(columns.length, 1);

  const panelAlign =
    align === "end"
      ? "right-0 left-auto translate-x-0"
      : align === "start"
        ? "left-0 right-auto translate-x-0"
        : "left-1/2 -translate-x-1/2";

  return (
    <div
      ref={rootRef}
      className="relative"
      onMouseEnter={openMenu}
      onMouseLeave={scheduleClose}
      style={{
        ["--accent" as string]: theme.accentVar,
        ["--accent-soft" as string]: theme.accentSoftVar,
      }}
    >
      <Link
        href={`/#${category}`}
        className={[
          "inline-flex items-center gap-1 rounded-full px-2.5 py-1.5 text-sm font-medium transition-colors",
          open
            ? "bg-white/15 text-white"
            : "text-white/90 hover:bg-white/10 hover:text-white",
        ].join(" ")}
        aria-expanded={open}
        aria-controls={menuId}
        aria-haspopup="true"
        onFocus={openMenu}
        onClick={() => setOpen(false)}
      >
        {label}
        <svg
          viewBox="0 0 12 12"
          className={[
            "size-2.5 opacity-70 transition-transform duration-200",
            open ? "rotate-180" : "",
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
      </Link>

      <div
        id={menuId}
        role="menu"
        aria-label={label}
        className={[
          "absolute top-[calc(100%+0.55rem)] z-50",
          panelAlign,
          "origin-top transition-[opacity,transform,visibility] duration-150",
          open
            ? "visible translate-y-0 opacity-100"
            : "invisible pointer-events-none -translate-y-1 opacity-0",
        ].join(" ")}
        onMouseEnter={openMenu}
        onMouseLeave={scheduleClose}
      >
        <div className="absolute inset-x-0 -top-3 h-3" aria-hidden="true" />

        <div
          className={[
            "glass-liquid",
            columnCount >= 3
              ? "w-[min(42rem,calc(100vw-2rem))]"
              : columnCount > 1
                ? "w-[min(32rem,calc(100vw-2rem))]"
                : "min-w-[14rem]",
          ].join(" ")}
        >
          <div
            className="grid items-start gap-0"
            style={{
              gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))`,
            }}
          >
            {columns.map((column, index) => (
              <div
                key={column.id}
                className={[
                  "p-3 sm:p-3.5",
                  index > 0 ? "border-l border-white/12" : "",
                ].join(" ")}
              >
                <Link
                  href={`/#${category}`}
                  role="menuitem"
                  onClick={() => setOpen(false)}
                  className="mb-2 block px-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/55 transition-colors hover:text-[color:var(--accent)]"
                >
                  {messages.nav.menu[column.titleKey]}
                </Link>

                <ul className="space-y-0.5">
                  {column.toolIds.map((toolId) => {
                    const toolName = messages.tools[toolId]?.name ?? toolId;
                    return (
                      <li key={toolId}>
                        <Link
                          href={`/tools/${toolId}`}
                          role="menuitem"
                          onClick={() => setOpen(false)}
                          className="group flex items-center gap-2.5 rounded-xl px-2 py-2 text-sm text-white transition-colors hover:bg-white/12"
                        >
                          <span className="flex size-7 shrink-0 items-center justify-center rounded-lg border border-white/20 bg-white/10 p-1.5 text-[color:var(--accent)] shadow-[inset_0_1px_0_rgba(255,255,255,0.25)] transition-colors group-hover:border-[color:var(--accent)] group-hover:bg-[var(--accent-soft)]">
                            <CategoryIcon
                              category={category}
                              className="size-full"
                            />
                          </span>
                          <span className="min-w-0 flex-1 font-medium leading-snug drop-shadow-[0_1px_8px_rgba(0,0,0,0.35)]">
                            {toolName}
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
