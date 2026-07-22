"use client";

import Link from "next/link";
import { LanguageToggle } from "./language-toggle";
import { NavCategoryMenu } from "./nav-category-menu";
import { ToolSearch } from "./tool-search";
import { getToolsByCategory } from "../lib/tools";
import type { CategoryId } from "../lib/category-theme";

export function SiteHeader() {
  const categories = getToolsByCategory().map(
    (group) => group.category as CategoryId,
  );

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-50 px-4 pt-4 sm:px-6">
      <div className="glass-nav pointer-events-auto relative mx-auto flex h-14 max-w-6xl items-center gap-3 overflow-visible px-3 sm:gap-4 sm:px-5">
        <Link
          href="/"
          className="shrink-0 font-[family-name:var(--font-display)] text-lg font-semibold tracking-tight text-white"
        >
          Parivartan
        </Link>

        <ToolSearch
          compact
          className="hidden min-w-0 flex-1 sm:block sm:max-w-[14rem] md:max-w-[16rem] lg:max-w-[18rem]"
        />

        <nav className="ml-auto hidden items-center gap-0.5 lg:flex">
          {categories.map((category, index) => {
            const align: "start" | "center" | "end" =
              index === 0
                ? "start"
                : index >= categories.length - 2
                  ? "end"
                  : "center";
            return (
              <NavCategoryMenu
                key={category}
                category={category}
                align={align}
              />
            );
          })}
        </nav>

        <div className="ml-auto shrink-0 lg:ml-0">
          <LanguageToggle />
        </div>
      </div>
    </header>
  );
}
