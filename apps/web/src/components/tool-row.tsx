import Link from "next/link";
import type { ToolDefinition } from "@convert-hub/shared";

interface ToolRowProps {
  tool: ToolDefinition;
}

export function ToolRow({ tool }: ToolRowProps) {
  return (
    <li>
      <Link
        href={`/tools/${tool.id}`}
        className="flex items-baseline justify-between gap-4 px-4 py-3.5 transition-colors hover:bg-background-subtle"
      >
        <span className="text-[15px] text-foreground">{tool.name}</span>
        <span className="shrink-0 text-sm text-faint">Open</span>
      </Link>
    </li>
  );
}
