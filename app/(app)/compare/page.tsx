import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowDown, ArrowRight, ArrowUp, Equal, Film, GitCompareArrows } from "lucide-react";

import { ScoreRing } from "@/components/app/score-ring";
import { ComparePicker } from "@/components/compare/compare-picker";
import { RatingChip } from "@/components/report/rating-chip";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AREA_IDS, AREA_LABELS, analysisResultSchema, type AnalysisResult, type Rating } from "@/lib/analysis/schema";
import { requireUser } from "@/lib/auth";
import { getAnalyses, type AnalysisListItem } from "@/lib/data";
import { platformLabel } from "@/lib/platforms";
import { cn, formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Compare videos" };

export default function ComparePage({ searchParams }: PageProps<"/compare">) {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
      <header className="mb-8">
        <p className="label-mono text-lime">Compare</p>
        <h1 className="mt-3 text-3xl tracking-[-0.03em] sm:text-4xl">Compare videos</h1>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground sm:text-[15px]">
          Put two analyses side by side to see which areas improved and which slipped.
        </p>
      </header>
      <Suspense fallback={<CompareSkeleton />}>
        <Comparison searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

type Scored = AnalysisListItem & { parsed: AnalysisResult };

const RANK: Record<Rating, number | null> = { weak: 0, ok: 1, strong: 2, not_assessed: null };

async function Comparison({ searchParams }: { searchParams: PageProps<"/compare">["searchParams"] }) {
  await requireUser("/compare");
  const params = await searchParams;
  const pick = (v: string | string[] | undefined) => (typeof v === "string" ? v : undefined);

  const complete: Scored[] = [];
  for (const item of await getAnalyses(100)) {
    if (item.status !== "complete") continue;
    const parsed = analysisResultSchema.safeParse(item.result);
    if (parsed.success) complete.push({ ...item, parsed: parsed.data });
  }

  if (complete.length < 2) {
    return (
      <div className="surface-card flex flex-col items-center px-6 py-14 text-center">
        <span className="inline-flex size-14 items-center justify-center rounded-2xl bg-icon-tile text-lime">
          <GitCompareArrows className="size-6" aria-hidden="true" />
        </span>
        <h2 className="mt-5 text-lg font-semibold">You need two completed analyses</h2>
        <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
          {complete.length === 1
            ? "Analyze one more video to compare it with your first."
            : "Analyze two videos, then compare them here."}
        </p>
        <Button asChild className="mt-6">
          <Link href="/upload">Analyze a video</Link>
        </Button>
      </div>
    );
  }

  const byId = new Map(complete.map((c) => [c.id, c]));
  // Default: previous video (A) vs latest (B).
  let a = byId.get(pick(params.a) ?? "") ?? complete[1];
  let b = byId.get(pick(params.b) ?? "") ?? complete[0];
  if (a.id === b.id) [a, b] = [complete.find((c) => c.id !== b.id)!, b];

  const options = complete.map((c) => ({
    id: c.id,
    label: `${c.title ?? "Untitled video"} · ${platformLabel(c.platform)} · ${formatDate(c.created_at)} · ${c.score}`,
  }));

  const diff = (b.score ?? 0) - (a.score ?? 0);
  const areas = AREA_IDS.map((id) => {
    const ra = a.parsed.areas.find((x) => x.id === id)?.rating ?? "not_assessed";
    const rb = b.parsed.areas.find((x) => x.id === id)?.rating ?? "not_assessed";
    const na = RANK[ra];
    const nb = RANK[rb];
    const change = na === null || nb === null ? null : Math.sign(nb - na);
    return { id, label: AREA_LABELS[id], ra, rb, change };
  });
  const improved = areas.filter((r) => r.change === 1).length;
  const slipped = areas.filter((r) => r.change === -1).length;

  return (
    <div className="space-y-8">
      <ComparePicker options={options} a={a.id} b={b.id} />

      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <VideoColumn item={a} tag="A" />
        <VideoColumn item={b} tag="B" />
      </div>

      <p className="surface-card p-4 text-center text-sm text-muted-foreground" role="status">
        {diff === 0 ? (
          <>Both videos score the same.</>
        ) : (
          <>
            Video <span className="font-semibold text-foreground">{diff > 0 ? "B" : "A"}</span> scores{" "}
            <span className="font-semibold text-foreground">{Math.abs(diff)} points</span> higher.
          </>
        )}{" "}
        B is stronger in {improved} {improved === 1 ? "area" : "areas"} and weaker in {slipped}.
      </p>

      <section aria-labelledby="areas-compare-title" className="surface-card overflow-hidden">
        <h2 id="areas-compare-title" className="sr-only">
          Area ratings
        </h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th scope="col" className="label-mono px-4 py-3 text-left text-[10px] font-medium text-muted-foreground sm:px-5">
                Area
              </th>
              <th scope="col" className="label-mono px-2 py-3 text-left text-[10px] font-medium text-muted-foreground">
                A
              </th>
              <th scope="col" className="label-mono px-2 py-3 text-left text-[10px] font-medium text-muted-foreground">
                B
              </th>
              <th scope="col" className="px-4 py-3 sm:px-5">
                <span className="sr-only">Change from A to B</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {areas.map((row) => (
              <tr key={row.id}>
                <th scope="row" className="px-4 py-3 text-left font-medium text-foreground sm:px-5">
                  {row.label}
                </th>
                <td className="px-2 py-3">
                  <RatingChip rating={row.ra} className="px-2" />
                </td>
                <td className="px-2 py-3">
                  <RatingChip rating={row.rb} className="px-2" />
                </td>
                <td className="px-4 py-3 text-right sm:px-5">
                  <Change value={row.change} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

function VideoColumn({ item, tag }: { item: Scored; tag: "A" | "B" }) {
  return (
    <article className="surface-card flex flex-col p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <span className="font-mono text-xs font-semibold text-lime">Video {tag}</span>
        <span className="rounded-md border border-border px-1.5 py-0.5 font-mono text-[10px] tracking-wide text-foreground/80 uppercase">
          {platformLabel(item.platform)}
        </span>
      </div>
      <div className="mt-4 flex flex-col items-center gap-4 sm:flex-row sm:items-center">
        <span className="relative flex h-24 w-[54px] shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-surface-raised">
          {item.thumbnailUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.thumbnailUrl} alt="" className="size-full object-cover" />
          ) : (
            <Film className="size-4 text-muted-foreground" aria-hidden="true" />
          )}
        </span>
        <ScoreRing score={item.parsed.overallScore} size={84} strokeWidth={7} />
      </div>
      <h3 className="mt-4 line-clamp-2 text-sm font-semibold">{item.title ?? "Untitled video"}</h3>
      <p className="mt-1 font-mono text-[11px] text-muted-foreground">{formatDate(item.created_at)}</p>
      <p className="mt-3 line-clamp-4 flex-1 text-[13px] leading-relaxed text-muted-foreground">
        {item.parsed.summary.finalVerdict}
      </p>
      <Link
        href={`/analysis/${item.id}`}
        className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-lime hover:underline"
      >
        Open report
        <ArrowRight className="size-3.5" aria-hidden="true" />
      </Link>
    </article>
  );
}

function Change({ value }: { value: number | null }) {
  if (value === null) return <span className="font-mono text-xs text-muted-foreground">—</span>;
  const Icon = value > 0 ? ArrowUp : value < 0 ? ArrowDown : Equal;
  const label = value > 0 ? "Better in B" : value < 0 ? "Worse in B" : "Same";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-xs font-medium",
        value > 0 ? "text-lime" : value < 0 ? "text-[#f87171]" : "text-muted-foreground",
      )}
    >
      <Icon className="size-3.5" aria-hidden="true" />
      <span className="hidden sm:inline">{label}</span>
      <span className="sr-only sm:hidden">{label}</span>
    </span>
  );
}

function CompareSkeleton() {
  return (
    <div className="space-y-8" aria-busy="true" aria-label="Loading comparison">
      <div className="grid gap-4 sm:grid-cols-2">
        <Skeleton className="h-[70px]" />
        <Skeleton className="h-[70px]" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Skeleton className="h-72 rounded-2xl" />
        <Skeleton className="h-72 rounded-2xl" />
      </div>
      <Skeleton className="h-[560px] rounded-2xl" />
    </div>
  );
}
