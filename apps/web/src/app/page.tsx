import { ToolRow } from "../components/tool-row";
import { getToolsByCategory } from "../lib/tools";

export default function Home() {
  const groups = getToolsByCategory();

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
      <div className="max-w-xl">
        <h1 className="text-2xl font-semibold tracking-tight">
          File conversion tools
        </h1>
        <p className="mt-2 text-[15px] text-muted">
          Convert PDFs, images, and video. No account required.
        </p>
      </div>

      <div className="mt-12 space-y-10">
        {groups.map((group) => (
          <section key={group.category}>
            <h2 className="text-xs font-medium uppercase tracking-wider text-faint">
              {group.label}
            </h2>
            <ul className="mt-3 divide-y divide-border rounded border border-border bg-background">
              {group.tools.map((tool) => (
                <ToolRow key={tool.id} tool={tool} />
              ))}
            </ul>
          </section>
        ))}
      </div>
    </main>
  );
}
