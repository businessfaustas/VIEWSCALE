import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { tools, type Tool } from "@/lib/tools";
import { cn } from "@/lib/utils";

export function ToolGrid({ className }: { className?: string }) {
  return (
    <ul className={cn("grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3", className)}>
      {tools.map((tool) => (
        <li key={tool.id}>
          <ToolCard tool={tool} highlighted={tool.id === "analyze"} />
        </li>
      ))}
    </ul>
  );
}

function ToolCard({ tool, highlighted }: { tool: Tool; highlighted: boolean }) {
  const body = (
    <>
      <div className="flex items-start justify-between gap-2">
        <span
          className={cn(
            "inline-flex size-10 items-center justify-center rounded-xl bg-icon-tile sm:size-12",
            tool.href ? "text-lime" : "text-lime/45",
          )}
        >
          <tool.icon className="size-5 sm:size-[22px]" strokeWidth={1.9} aria-hidden="true" />
        </span>
        {tool.href ? (
          <ArrowUpRight
            className="size-4 text-muted-foreground transition-colors group-hover:text-lime"
            aria-hidden="true"
          />
        ) : (
          <span className="rounded-full border border-border px-2 py-0.5 font-mono text-[9px] tracking-wider whitespace-nowrap text-muted-foreground uppercase">
            Coming soon
          </span>
        )}
      </div>
      <p
        className={cn(
          "mt-4 text-sm font-semibold sm:text-[15px]",
          tool.href ? "text-foreground" : "text-foreground/55",
        )}
      >
        {tool.title}
      </p>
      <p
        className={cn(
          "mt-1 hidden text-[13px] leading-snug sm:block",
          tool.href ? "text-muted-foreground" : "text-muted-foreground/60",
        )}
      >
        {tool.description}
      </p>
    </>
  );

  const base = "group block h-full rounded-2xl border bg-card p-4 sm:p-5";

  if (!tool.href) {
    return (
      <div aria-disabled="true" className={cn(base, "border-border/70")}>
        {body}
        <span className="sr-only">Coming soon</span>
      </div>
    );
  }

  return (
    <Link
      href={tool.href}
      className={cn(
        base,
        "transition-colors focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:outline-none",
        highlighted
          ? "border-lime/35 bg-gradient-to-b from-lime/[0.05] to-card hover:border-lime/60"
          : "border-border hover:border-lime/35",
      )}
    >
      {body}
    </Link>
  );
}
