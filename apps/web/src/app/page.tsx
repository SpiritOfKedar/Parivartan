import { CategoryBand } from "../components/category-band";
import { Hero } from "../components/hero";
import { getToolsByCategory } from "../lib/tools";
import type { CategoryId } from "../lib/category-theme";

export default function Home() {
  const groups = getToolsByCategory();
  const categories = groups.map((group) => group.category as CategoryId);

  return (
    <>
      <Hero categories={categories} />

      <main className="relative mx-auto w-full min-w-0 max-w-6xl flex-1 px-4 pb-16 pt-8 sm:px-10 sm:pb-24 sm:pt-14">
        <div className="w-full min-w-0 space-y-14 sm:space-y-24">
          {groups.map((group, i) => (
            <CategoryBand
              key={group.category}
              category={group.category as CategoryId}
              tools={group.tools}
              index={i + 1}
            />
          ))}
        </div>
      </main>
    </>
  );
}
