"use client";

import { CategoryIcon } from "./category-icon";
import { Reveal } from "./reveal";
import type { CategoryId } from "../lib/category-theme";
import { categoryThemes } from "../lib/category-theme";
import { useTranslations } from "../lib/i18n/locale-provider";

interface HeroProps {
  categories: CategoryId[];
}

export function Hero({ categories }: HeroProps) {
  const messages = useTranslations();
  const { hero } = messages;

  return (
    <section className="relative flex h-[100svh] min-h-[560px] w-full flex-col justify-end overflow-hidden">
      <div className="relative z-10 mx-auto w-full max-w-6xl px-6 pb-16 sm:px-10">
        <div className="max-w-2xl animate-rise">
          <h1 className="font-[family-name:var(--font-display)] text-5xl font-semibold leading-[1.02] tracking-tight text-white sm:text-7xl">
            {hero.line1}
            <br />
            {hero.line2Before}
            <em className="font-medium italic text-white/90">
              {hero.line2Emphasized}
            </em>
            {hero.line2After}
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/80">
            {hero.body}
          </p>

          <div className="mt-9 flex flex-wrap gap-2.5">
            {categories.map((category, index) => {
              const theme = categoryThemes[category];
              return (
                <Reveal
                  key={category}
                  delay={120 + index * 70}
                  variant="scale"
                  className="inline-flex"
                >
                  <a
                    href={`#${category}`}
                    className="chip"
                    style={{
                      ["--accent" as string]: theme.accentVar,
                      ["--accent-soft" as string]: theme.accentSoftVar,
                    }}
                  >
                    <CategoryIcon category={category} className="size-4" />
                    {messages.categories[category].label}
                  </a>
                </Reveal>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
