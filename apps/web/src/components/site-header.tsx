import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="border-b border-border">
      <div className="mx-auto flex h-14 max-w-3xl items-center px-6">
        <Link href="/" className="text-[15px] font-semibold tracking-tight">
          Parivartan
        </Link>
      </div>
    </header>
  );
}
