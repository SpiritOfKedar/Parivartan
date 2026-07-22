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
      return "grid gap-3 sm:grid-cols-2 lg:grid-cols-3";
    case "ledger":
      return "grid gap-3 sm:grid-cols-2";
    case "cinema":
      return "grid gap-4 sm:grid-cols-2";
    case "waveform":
      return "grid gap-3 sm:grid-cols-2";
    default:
      return "grid gap-3 sm:grid-cols-2";
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
    <Reveal variant="up" className="scroll-mt-24">
      <section
        id={category}
        style={{
          ["--accent" as string]: theme.accentVar,
          ["--accent-soft" as string]: theme.accentSoftVar,
        }}
      >
        <div className="flex items-start justify-between gap-6">
          <div className="flex items-start gap-4">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-border bg-[rgba(255,255,255,0.05)] p-2.5 backdrop-blur">
              <CategoryIcon category={category} className="size-full" />
            </span>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight text-foreground">
                  {copy.label}
                </h2>
                <span className="text-sm tabular-nums text-faint">
                  {String(index).padStart(2, "0")}
                </span>
              </div>
              <p className="mt-1.5 max-w-xl text-[15px] text-muted">
                {copy.blurb}
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

        <div className={`mt-6 ${layoutClassName(theme.layout)}`}>
          {tools.map((tool, toolIndex) => (
            <Reveal
              key={tool.id}
              delay={Math.min(toolIndex * 55, 330)}
              variant="scale"
            >
              <ToolLink tool={tool} layout={theme.layout} />
            </Reveal>
          ))}
        </div>
      </section>
    </Reveal>
  );
}
