import Link from "next/link";
import { ThemeToggle } from "./theme-toggle";

export function SiteHeader() {
  return (
    <header className="border-b border-border">
      <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-6">
        <Link href="/" className="text-[15px] font-semibold tracking-tight">
          Parivartan
        </Link>
        <ThemeToggle />
      </div>
    </header>
  );
}
