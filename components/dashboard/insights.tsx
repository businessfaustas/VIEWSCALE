import type { AreaBreakdown } from "@/lib/analysis/stats";

const SEGMENTS = [
  { key: "weak", label: "Weak", color: "#EF4444" },
  { key: "ok", label: "OK", color: "#F59E0B" },
  { key: "strong", label: "Strong", color: "#B8FF3C" },
] as const;

/** How each of the 12 areas has been rated across your completed analyses. */
export function Insights({ rows }: { rows: AreaBreakdown[] }) {
  return (
    <div className="surface-card p-5 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className="text-base font-semibold">Where your videos keep slipping</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Ratings for each area across every completed analysis, weakest first.
          </p>
        </div>
        <ul className="flex gap-4 text-xs text-muted-foreground" aria-label="Legend">
          {SEGMENTS.map((s) => (
            <li key={s.key} className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-[3px]" style={{ backgroundColor: s.color }} />
              {s.label}
            </li>
          ))}
        </ul>
      </div>

      <ul className="mt-6 space-y-4">
        {rows.map((row) => (
          <li key={row.id} className="grid gap-2 sm:grid-cols-[180px_1fr_auto] sm:items-center sm:gap-4">
            <span className="text-sm font-medium text-foreground">{row.label}</span>
            <div
              className="flex h-2.5 gap-[2px] overflow-hidden rounded-full bg-border"
              role="img"
              aria-label={`${row.label}: ${row.counts.weak} weak, ${row.counts.ok} OK, ${row.counts.strong} strong`}
            >
              {SEGMENTS.map((s) =>
                row.counts[s.key] > 0 ? (
                  <span
                    key={s.key}
                    className="h-full first:rounded-l-full last:rounded-r-full"
                    style={{
                      width: `${(row.counts[s.key] / row.assessed) * 100}%`,
                      backgroundColor: s.color,
                    }}
                  />
                ) : null,
              )}
            </div>
            <span className="font-mono text-xs text-muted-foreground tabular-nums">
              {row.counts.weak}/{row.assessed} weak
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
