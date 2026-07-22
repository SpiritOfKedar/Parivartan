"use client";

import type { ToolDefinition } from "@convert-hub/shared";
import { CategoryIcon } from "./category-icon";
import { Reveal } from "./reveal";
import { ToolLink } from "./tool-row";
import { getCategoryTheme, type CategoryId } from "../lib/category-theme";
import { formatMessage } from "../lib/i18n/get-dictionary";
import { useTranslations } from "../lib/i18n/locale-provider";

interface CategoryBandProps {
  category: CategoryId;
  tools: ToolDefinition[];
  index: number;
}

function layoutClassName(layout: string): string {
  switch (layout) {
    case "tiles":
      return "grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3";
    case "ledger":
      return "grid grid-cols-1 gap-3 sm:grid-cols-2";
    case "cinema":
      return "grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4";
    case "waveform":
      return "grid grid-cols-1 gap-3 sm:grid-cols-2";
    default:
      return "grid grid-cols-1 gap-3 sm:grid-cols-2";
  }
}

export function CategoryBand({ category, tools, index }: CategoryBandProps) {
  const messages = useTranslations();
  const theme = getCategoryTheme(category);
  const copy = messages.categories[category];

  if (tools.length === 0) {
    return null;
  }

  const countLabel =
    tools.length === 1
      ? messages.common.toolCountOne
      : formatMessage(messages.common.toolsCount, { count: tools.length });

  return (
    <Reveal variant="up" className="scroll-mt-24 w-full min-w-0">
      <section
        id={category}
        className="w-full min-w-0"
        style={{
          ["--accent" as string]: theme.accentVar,
          ["--accent-soft" as string]: theme.accentSoftVar,
        }}
      >
        <div className="flex min-w-0 items-start justify-between gap-3 sm:gap-6">
          <div className="flex min-w-0 flex-1 items-start gap-3 sm:gap-4">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl border border-white/12 bg-black/40 p-2 backdrop-blur-xl sm:size-12 sm:p-2.5">
              <CategoryIcon category={category} className="size-full" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                  {copy.label}
                </h2>
                <span className="text-sm tabular-nums text-faint">
                  {String(index).padStart(2, "0")}
                </span>
              </div>
              <p className="mt-1.5 text-sm leading-relaxed text-muted sm:text-[15px]">
                {copy.blurb}
              </p>
              <p className="mt-2 text-[11px] font-medium uppercase tracking-[0.18em] text-faint sm:hidden">
                {countLabel}
              </p>
            </div>
          </div>
          <span className="mt-2 hidden shrink-0 text-xs font-medium uppercase tracking-[0.2em] text-faint sm:block">
            {countLabel}
          </span>
        </div>

        <div
          className="mt-4 h-px w-full"
          style={{
            background:
              "linear-gradient(90deg, var(--accent) 0%, transparent 55%)",
          }}
        />

        <div className={`mt-5 sm:mt-6 ${layoutClassName(theme.layout)}`}>
          {tools.map((tool, toolIndex) => (
            <Reveal
              key={tool.id}
              delay={Math.min(toolIndex * 55, 330)}
              variant="scale"
              className="min-w-0"
            >
              <ToolLink tool={tool} layout={theme.layout} />
            </Reveal>
          ))}
        </div>
      </section>
    </Reveal>
  );
}
