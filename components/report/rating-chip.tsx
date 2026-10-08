import type { Rating } from "@/lib/analysis/schema";
import { cn } from "@/lib/utils";

const STYLE: Record<Rating, { label: string; className: string; dot: string }> = {
  strong: { label: "Strong", className: "border-lime/30 bg-lime/[0.07] text-lime", dot: "bg-lime" },
  ok: { label: "OK", className: "border-warning/30 bg-warning/[0.07] text-warning", dot: "bg-warning" },
  weak: { label: "Weak", className: "border-danger/35 bg-danger/[0.08] text-[#f87171]", dot: "bg-danger" },
  not_assessed: {
    label: "Not assessed",
    className: "border-border bg-surface-raised text-muted-foreground",
    dot: "bg-muted-foreground/60",
  },
};

export function RatingChip({ rating, className }: { rating: Rating; className?: string }) {
  const style = STYLE[rating];
  return (
    <span
      className={cn(
        "inline-flex h-6 shrink-0 items-center gap-1.5 rounded-full border px-2.5 font-mono text-[10px] font-medium tracking-wider uppercase",
        style.className,
        className,
      )}
    >
      <span className={cn("size-1.5 rounded-full", style.dot)} aria-hidden="true" />
      {style.label}
    </span>
  );
}
