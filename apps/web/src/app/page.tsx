import { tools } from "@convert-hub/conversion-rules";

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-50 px-6 py-16 font-sans text-zinc-900">
      <main className="mx-auto max-w-3xl">
        <h1 className="text-4xl font-semibold tracking-tight">Convert Hub</h1>
        <p className="mt-3 text-lg text-zinc-600">
          Multi-format conversions — PDF, images, audio, and video.
        </p>

        <section className="mt-10">
          <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-500">
            Tools (scaffold)
          </h2>
          <ul className="mt-4 divide-y divide-zinc-200 rounded-xl border border-zinc-200 bg-white">
            {tools.map((tool) => (
              <li
                key={tool.id}
                className="flex items-center justify-between px-4 py-3"
              >
                <span className="font-medium">{tool.name}</span>
                <span className="text-sm text-zinc-500">{tool.category}</span>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}
