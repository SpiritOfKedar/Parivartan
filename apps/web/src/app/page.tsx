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

      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-20 sm:px-10">
        <div className="space-y-24">
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
