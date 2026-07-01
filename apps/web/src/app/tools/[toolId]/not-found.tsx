import Link from "next/link";

export default function ToolNotFound() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-16">
      <h1 className="text-xl font-semibold">Tool not found</h1>
      <p className="mt-2 text-[15px] text-muted">
        That conversion tool does not exist.
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex items-center rounded border border-border px-3 py-1.5 text-sm text-foreground transition-colors hover:bg-background-subtle"
      >
        ← All tools
      </Link>
    </main>
  );
}
