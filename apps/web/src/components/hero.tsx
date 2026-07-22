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
  const firstCategory = categories[0];

  return (
    <section className="relative flex h-[100svh] min-h-[620px] w-full flex-col">
      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col justify-end px-6 pb-14 pt-24 sm:px-10 sm:pb-16">
        <div className="max-w-2xl">
          <div className="animate-rise">
            <h1 className="font-[family-name:var(--font-display)] text-5xl font-semibold leading-[1.02] tracking-tight text-white drop-shadow-[0_2px_24px_rgba(0,0,0,0.45)] sm:text-7xl">
              {hero.line1}
              <br />
              {hero.line2Before}
              <em className="font-medium italic text-white/90">
                {hero.line2Emphasized}
              </em>
              {hero.line2After}
            </h1>

            <p className="mt-5 max-w-lg text-lg leading-relaxed text-white/80 drop-shadow-[0_1px_12px_rgba(0,0,0,0.4)]">
              {hero.body}
            </p>
          </div>

          <div className="mt-9 flex flex-wrap gap-2.5">
            {categories.map((category, index) => {
              const theme = categoryThemes[category];
              return (
                <Reveal
                  key={category}
                  delay={140 + index * 80}
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

        {firstCategory ? (
          <a
            href={`#${firstCategory}`}
            className="hero-scroll-hint mt-12 inline-flex w-fit items-center gap-2 text-sm font-medium text-white/65 transition-colors hover:text-white"
          >
            <span className="hero-scroll-hint__line" aria-hidden="true" />
            {hero.scrollHint}
          </a>
        ) : null}
      </div>
    </section>
  );
}
