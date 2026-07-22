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
    <section className="relative flex min-h-[100svh] w-full flex-col sm:min-h-[620px]">
      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col justify-end px-4 pb-10 pt-20 sm:px-10 sm:pb-16 sm:pt-24">
        <div className="w-full max-w-2xl min-w-0">
          <div className="animate-rise">
            <h1 className="font-[family-name:var(--font-display)] text-[2.35rem] font-semibold leading-[1.05] tracking-tight text-white drop-shadow-[0_2px_24px_rgba(0,0,0,0.45)] sm:text-6xl md:text-7xl">
              {hero.line1}
              <br />
              {hero.line2Before}
              <em className="font-medium italic text-white/90">
                {hero.line2Emphasized}
              </em>
              {hero.line2After}
            </h1>

            <p className="mt-4 max-w-lg text-base leading-relaxed text-white/80 drop-shadow-[0_1px_12px_rgba(0,0,0,0.4)] sm:mt-5 sm:text-lg">
              {hero.body}
            </p>
          </div>

          <div className="mt-7 flex max-w-full flex-wrap gap-2 sm:mt-9 sm:gap-2.5">
            {categories.map((category, index) => {
              const theme = categoryThemes[category];
              return (
                <Reveal
                  key={category}
                  delay={140 + index * 80}
                  variant="scale"
                  className="inline-flex max-w-full"
                >
                  <a
                    href={`#${category}`}
                    className="chip max-w-full"
                    style={{
                      ["--accent" as string]: theme.accentVar,
                      ["--accent-soft" as string]: theme.accentSoftVar,
                    }}
                  >
                    <CategoryIcon
                      category={category}
                      className="size-4 shrink-0"
                    />
                    <span className="truncate">
                      {messages.categories[category].label}
                    </span>
                  </a>
                </Reveal>
              );
            })}
          </div>
        </div>

        {firstCategory ? (
          <a
            href={`#${firstCategory}`}
            className="hero-scroll-hint mt-8 inline-flex w-fit items-center gap-2 text-sm font-medium text-white/65 transition-colors hover:text-white sm:mt-12"
          >
            <span className="hero-scroll-hint__line" aria-hidden="true" />
            {hero.scrollHint}
          </a>
        ) : null}
      </div>
    </section>
  );
}
