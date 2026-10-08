import { AREA_IDS, AREA_LABELS, type AreaId, type AnalysisResult, type Rating } from "@/lib/analysis/schema";
import type { Json } from "@/lib/database.types";

type Scored = { score: number | null; status: string; result: Json | null };

function areasOf(result: Json | null) {
  const areas = (result as Partial<AnalysisResult> | null)?.areas;
  return Array.isArray(areas) ? areas : [];
}

/** The area that most limits a single video: its weak area with the most issues. */
export function biggestProblemArea(result: Json | null): AreaId | null {
  const weak = areasOf(result).filter((a) => a.rating === "weak");
  if (!weak.length) return null;
  weak.sort((a, b) => (b.issues?.length ?? 0) - (a.issues?.length ?? 0));
  return weak[0].id;
}

export function dashboardStats(analyses: Scored[]) {
  const done = analyses.filter((a) => a.status === "complete" && typeof a.score === "number");
  const scores = done.map((a) => a.score as number);

  const problemCounts = new Map<AreaId, number>();
  for (const a of done) {
    const id = biggestProblemArea(a.result);
    if (id) problemCounts.set(id, (problemCounts.get(id) ?? 0) + 1);
  }
  let topIssue: AreaId | null = null;
  for (const [id, count] of problemCounts) {
    if (!topIssue || count > (problemCounts.get(topIssue) ?? 0)) topIssue = id;
  }

  return {
    analyzed: done.length,
    averageScore: scores.length ? Math.round(scores.reduce((s, n) => s + n, 0) / scores.length) : null,
    bestScore: scores.length ? Math.max(...scores) : null,
    topIssue: topIssue ? AREA_LABELS[topIssue] : null,
  };
}

export type AreaBreakdown = {
  id: AreaId;
  label: string;
  counts: Record<Exclude<Rating, "not_assessed">, number>;
  assessed: number;
};

/** How often each of the 12 areas was rated weak / ok / strong across completed analyses. */
export function areaBreakdown(analyses: Scored[]): AreaBreakdown[] {
  const done = analyses.filter((a) => a.status === "complete");
  const rows = AREA_IDS.map((id) => ({
    id,
    label: AREA_LABELS[id],
    counts: { weak: 0, ok: 0, strong: 0 },
    assessed: 0,
  }));
  const byId = new Map(rows.map((r) => [r.id, r]));
  for (const a of done) {
    for (const area of areasOf(a.result)) {
      const row = byId.get(area.id);
      if (!row || area.rating === "not_assessed") continue;
      row.counts[area.rating] += 1;
      row.assessed += 1;
    }
  }
  return rows
    .filter((r) => r.assessed > 0)
    .sort((a, b) => b.counts.weak / b.assessed - a.counts.weak / a.assessed || b.assessed - a.assessed);
}
