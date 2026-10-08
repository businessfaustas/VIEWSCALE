import Link from "next/link";
import { ChevronRight, Film } from "lucide-react";

import { ScoreRing } from "@/components/app/score-ring";
import type { AnalysisListItem } from "@/lib/data";
import { platformLabel } from "@/lib/platforms";
import { cn, formatDate, formatTimestamp } from "@/lib/utils";

export function AnalysisList({ items }: { items: AnalysisListItem[] }) {
  return (
    <ul className="space-y-2.5">
      {items.map((item) => (
        <li key={item.id}>
          <Link
            href={`/analysis/${item.id}`}
            className="group flex items-center gap-4 rounded-2xl border border-border bg-card p-3 pr-4 transition-colors hover:border-[#28304a] focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:outline-none"
          >
            <Thumbnail url={item.thumbnailUrl} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-foreground">
                {item.title ?? "Untitled video"}
              </p>
              <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                <span className="rounded-md border border-border px-1.5 py-0.5 font-mono text-[10px] tracking-wide text-foreground/80 uppercase">
                  {platformLabel(item.platform)}
                </span>
                {item.duration ? <span>{formatTimestamp(item.duration)}</span> : null}
                <span aria-hidden="true">·</span>
                <span>{formatDate(item.created_at)}</span>
              </p>
            </div>
            <Status item={item} />
            <ChevronRight
              className="hidden size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 sm:block"
              aria-hidden="true"
            />
          </Link>
        </li>
      ))}
    </ul>
  );
}

function Thumbnail({ url }: { url: string | null }) {
  return (
    <span className="relative flex h-16 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-surface-raised">
      {url ? (
        // Signed Storage URLs change every hour, so skip next/image optimization.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="" className="size-full object-cover" loading="lazy" />
      ) : (
        <Film className="size-4 text-muted-foreground" aria-hidden="true" />
      )}
    </span>
  );
}

function Status({ item }: { item: AnalysisListItem }) {
  if (item.status === "complete" && typeof item.score === "number") {
    return <ScoreRing score={item.score} size={44} strokeWidth={4} />;
  }
  const failed = item.status === "failed";
  const label = failed ? "Failed" : item.status === "uploading" ? "Incomplete" : "Processing";
  return (
    <span
      className={cn(
        "rounded-full border px-2.5 py-1 font-mono text-[10px] tracking-wider uppercase",
        failed ? "border-danger/30 text-danger" : "border-border text-muted-foreground",
      )}
    >
      {label}
    </span>
  );
}
