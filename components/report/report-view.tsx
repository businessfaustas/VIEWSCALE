import Link from "next/link";
import {
  ArrowRight,
  Check,
  ChevronDown,
  Info,
  Sparkles,
  Target,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react";

import { ScoreRing } from "@/components/app/score-ring";
import { DropOffChart } from "@/components/charts/drop-off-chart";
import { CopyButton } from "@/components/report/copy-button";
import { ReportPlayerProvider, ReportVideo, TimestampChip } from "@/components/report/player";
import { ExportPdfButton, ReportActions } from "@/components/report/report-actions";
import { RatingChip } from "@/components/report/rating-chip";
import { Button } from "@/components/ui/button";
import type { PerformanceData } from "@/lib/analysis/inputs";
import type { AnalysisArea, AnalysisIssue, AnalysisResult } from "@/lib/analysis/schema";
import type { Platform } from "@/lib/database.types";
import { severityColor } from "@/lib/drop-off";
import { platformLong } from "@/lib/platforms";
import { cn, formatDate, formatTimestamp } from "@/lib/utils";

export type ReportData = {
  id: string;
  platform: Platform;
  createdAt: string;
  duration: number;
  title: string | null;
  result: AnalysisResult;
  videoUrl: string | null;
  thumbnailUrl: string | null;
  performance: PerformanceData | null;
  shareSlug: string | null;
};

type ReportViewProps =
  | { mode: "owner"; data: ReportData; siteUrl: string }
  | { mode: "shared"; data: ReportData; siteUrl?: never };

export function ReportView({ mode, data, siteUrl }: ReportViewProps) {
  const { result } = data;
  const firstWeak = result.areas.find((a) => a.rating === "weak")?.id;

  return (
    <ReportPlayerProvider>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12 print:max-w-none print:py-4">
        {mode === "shared" && (
          <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-lime/20 bg-lime/[0.04] p-4 sm:flex-row sm:items-center sm:justify-between print:hidden">
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">Shared ViewScale report.</span> Read-only
              diagnosis of a short-form video.
            </p>
            <Button asChild size="sm">
              <Link href="/sign-up">
                Analyze your own video
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </Button>
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-[minmax(0,290px)_minmax(0,1fr)] lg:gap-10 print:block">
          <aside className="mx-auto w-full max-w-[200px] sm:max-w-[240px] lg:sticky lg:top-24 lg:max-w-none lg:self-start print:hidden">
            <ReportVideo src={data.videoUrl} poster={data.thumbnailUrl} />
            <p className="mt-3 text-center text-xs text-muted-foreground lg:text-left">
              Tap any timestamp to jump the video there.
            </p>
          </aside>

          <div className="min-w-0 space-y-10">
            {/* Header */}
            <header className="surface-card p-5 sm:p-7">
              <div className="flex items-start gap-5 sm:items-center sm:gap-6">
                <ScoreRing score={result.overallScore} size={84} strokeWidth={7} className="sm:hidden" />
                <ScoreRing
                  score={result.overallScore}
                  size={128}
                  strokeWidth={9}
                  showMax
                  className="hidden sm:inline-grid"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-md border border-border px-2 py-0.5 font-mono text-[10px] tracking-wider text-foreground/85 uppercase">
                      {platformLong(data.platform)}
                    </span>
                    <span className="font-mono text-[11px] text-muted-foreground">
                      {formatTimestamp(data.duration)} · {formatDate(data.createdAt)}
                    </span>
                  </div>
                  <h1 className="mt-3 text-xl leading-snug tracking-tight sm:text-2xl">
                    {data.title ?? "Video report"}
                  </h1>
                  <p className="mt-2 text-[15px] leading-relaxed text-foreground/85">
                    {result.summary.finalVerdict}
                  </p>
                </div>
              </div>
              <div className="mt-6 border-t border-border pt-5">
                {mode === "owner" ? (
                  <ReportActions analysisId={data.id} initialSlug={data.shareSlug} siteUrl={siteUrl} />
                ) : (
                  <div className="print:hidden">
                    <ExportPdfButton />
                  </div>
                )}
              </div>
            </header>

            {/* Drop-off risk */}
            <section aria-labelledby="dropoff-title" className="surface-card p-5 sm:p-7">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 id="dropoff-title" className="text-lg font-semibold tracking-tight">
                    Estimated drop-off risk
                  </h2>
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Info className="size-3.5" aria-hidden="true" />
                    Based on content analysis, not real platform data.
                  </p>
                </div>
                <p className="label-mono text-[10px] text-muted-foreground">
                  {result.dropOffRisks.length} risk {result.dropOffRisks.length === 1 ? "point" : "points"}
                </p>
              </div>
              {result.dropOffRisks.length ? (
                <>
                  <DropOffChart risks={result.dropOffRisks} duration={data.duration} height={270} className="mt-3" />
                  <ul className="mt-5 divide-y divide-border border-t border-border">
                    {result.dropOffRisks.map((risk, i) => (
                      <li key={`${risk.timestamp}-${i}`} className="flex items-center gap-3 py-3">
                        <TimestampChip t={risk.timestamp} />
                        <span
                          className="h-0.5 w-3 shrink-0 rounded-full"
                          style={{ backgroundColor: severityColor[risk.severity] }}
                          aria-hidden="true"
                        />
                        <span className="min-w-0 flex-1 text-sm text-foreground">{risk.reason}</span>
                        <span className="font-mono text-[10px] tracking-wider text-muted-foreground uppercase">
                          {risk.severity}
                        </span>
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <p className="mt-5 text-sm text-muted-foreground">No specific drop-off points were found.</p>
              )}
            </section>

            {data.performance && <RealPerformance data={data.performance} />}

            {/* Summary */}
            <section aria-label="Summary" className="grid gap-4 md:grid-cols-3">
              <SummaryCard icon={Sparkles} label="Biggest strength" tone="lime" text={result.summary.biggestStrength} />
              <SummaryCard icon={TriangleAlert} label="Biggest problem" tone="red" text={result.summary.biggestProblem} />
              <SummaryCard icon={Target} label="Biggest opportunity" tone="orange" text={result.summary.biggestOpportunity} />
            </section>

            {/* Top fixes */}
            <section aria-labelledby="fixes-title">
              <SectionTitle id="fixes-title" label="Do these first" title="Top 3 fixes" />
              <ol className="mt-5 grid gap-3">
                {result.summary.topFixes.map((fix, i) => (
                  <li key={i} className="surface-card flex gap-4 p-5">
                    <span className="font-mono text-sm font-semibold text-lime">{String(i + 1).padStart(2, "0")}</span>
                    <p className="text-[15px] leading-relaxed text-foreground">{fix}</p>
                  </li>
                ))}
              </ol>
            </section>

            {/* Hook alternatives */}
            {result.summary.hookAlternatives.length > 0 && (
              <section aria-labelledby="hooks-title">
                <SectionTitle id="hooks-title" label="Rewrite the open" title="Hook alternatives" />
                <ul className="mt-5 grid gap-3 md:grid-cols-2">
                  {result.summary.hookAlternatives.map((alt, i) => (
                    <li key={i} className="surface-card flex flex-col gap-3 p-5">
                      <div className="flex items-center justify-between gap-3">
                        <span className="label-mono text-[10px] text-lime">{alt.angle}</span>
                        <CopyButton value={alt.hook} />
                      </div>
                      <p className="text-[15px] leading-relaxed text-foreground">“{alt.hook}”</p>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* 12 areas */}
            <section aria-labelledby="areas-title">
              <SectionTitle id="areas-title" label="Full diagnosis" title="12 areas, rated" />
              <div className="mt-5 space-y-3">
                {result.areas.map((area) => (
                  <AreaAccordion key={area.id} area={area} defaultOpen={area.id === firstWeak} />
                ))}
              </div>
            </section>

            {/* What to keep */}
            {result.summary.whatToKeep.length > 0 && (
              <section aria-labelledby="keep-title">
                <SectionTitle id="keep-title" label="Don't lose this" title="What to keep" />
                <ul className="surface-card mt-5 divide-y divide-border">
                  {result.summary.whatToKeep.map((item, i) => (
                    <li key={i} className="flex items-start gap-3 p-4">
                      <Check className="mt-0.5 size-4 shrink-0 text-lime" aria-hidden="true" />
                      <span className="text-[15px] text-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {result.missingInputs.length > 0 && (
              <section aria-labelledby="missing-title" className="rounded-2xl border border-border p-5">
                <h2 id="missing-title" className="text-sm font-semibold">
                  What this analysis didn&apos;t have
                </h2>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                  {result.missingInputs.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        </div>
      </div>
    </ReportPlayerProvider>
  );
}

function SectionTitle({ id, label, title }: { id: string; label: string; title: string }) {
  return (
    <div className="break-after-avoid">
      <p className="label-mono text-lime">{label}</p>
      <h2 id={id} className="mt-2 text-2xl tracking-[-0.02em]">
        {title}
      </h2>
    </div>
  );
}

const TONE = {
  lime: { icon: "bg-icon-tile text-lime", border: "border-lime/25" },
  red: { icon: "bg-danger/10 text-danger", border: "border-danger/30" },
  orange: { icon: "bg-warning/10 text-warning", border: "border-warning/30" },
} as const;

function SummaryCard({
  icon: Icon,
  label,
  text,
  tone,
}: {
  icon: LucideIcon;
  label: string;
  text: string;
  tone: keyof typeof TONE;
}) {
  return (
    <div className={cn("rounded-2xl border bg-card p-5", TONE[tone].border)}>
      <div className="flex items-center gap-3">
        <span className={cn("inline-flex size-9 items-center justify-center rounded-xl", TONE[tone].icon)}>
          <Icon className="size-[18px]" aria-hidden="true" />
        </span>
        <h3 className="label-mono text-[10px] text-muted-foreground">{label}</h3>
      </div>
      <p className="mt-4 text-[15px] leading-relaxed text-foreground">{text}</p>
    </div>
  );
}

function RealPerformance({ data }: { data: PerformanceData }) {
  const n = (v: number) => v.toLocaleString("en-US");
  const items = [
    data.views !== undefined && { label: "Views", value: n(data.views) },
    data.avgWatchPercent !== undefined && { label: "Avg. watch", value: `${data.avgWatchPercent}%` },
    data.likes !== undefined && { label: "Likes", value: n(data.likes) },
    data.shares !== undefined && { label: "Shares", value: n(data.shares) },
  ].filter(Boolean) as { label: string; value: string }[];
  if (!items.length) return null;

  return (
    <section aria-labelledby="real-title" className="surface-card p-5 sm:p-7">
      <div className="flex flex-wrap items-center gap-2">
        <h2 id="real-title" className="text-lg font-semibold tracking-tight">
          Real performance data
        </h2>
        <span className="rounded-full border border-lime/30 bg-lime/[0.07] px-2 py-0.5 font-mono text-[10px] tracking-wider text-lime uppercase">
          Real · provided by creator
        </span>
      </div>
      <dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {items.map((item) => (
          <div key={item.label} className="rounded-xl border border-border bg-background/60 p-4">
            <dt className="label-mono text-[10px] text-muted-foreground">{item.label}</dt>
            <dd className="mt-2 text-2xl font-bold tracking-tight">{item.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function AreaAccordion({ area, defaultOpen }: { area: AnalysisArea; defaultOpen: boolean }) {
  return (
    <details open={defaultOpen} className="group surface-card overflow-hidden print:break-inside-avoid-page">
      <summary className="flex cursor-pointer list-none items-center gap-3 p-4 transition-colors hover:bg-white/[0.02] focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:outline-none sm:p-5 [&::-webkit-details-marker]:hidden">
        <span className="min-w-0 flex-1 text-[15px] font-semibold text-foreground">{area.title}</span>
        {area.issues.length > 0 && (
          <span className="hidden font-mono text-[11px] text-muted-foreground sm:inline">
            {area.issues.length} {area.issues.length === 1 ? "issue" : "issues"}
          </span>
        )}
        <RatingChip rating={area.rating} />
        <ChevronDown
          className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180 print:hidden"
          aria-hidden="true"
        />
      </summary>
      <div className="space-y-4 border-t border-border px-4 py-5 sm:px-5">
        {area.summary && <p className="text-[15px] leading-relaxed text-muted-foreground">{area.summary}</p>}
        {area.issues.map((issue, i) => (
          <IssueCard key={i} issue={issue} />
        ))}
      </div>
    </details>
  );
}

function IssueCard({ issue }: { issue: AnalysisIssue }) {
  const rows: { label: string; value: string; strong?: boolean; quote?: boolean }[] = [
    { label: "Evidence", value: issue.evidence },
    { label: "Why it matters", value: issue.whyItMatters },
    { label: "Fix", value: issue.fix, strong: true },
    { label: "Example", value: issue.example, quote: true },
  ];
  return (
    <article className="rounded-xl border border-border bg-background/60 p-4 sm:p-5 print:break-inside-avoid">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-[15px] leading-snug font-semibold text-foreground">
          <span className="sr-only">Problem: </span>
          {issue.problem}
        </h3>
        {issue.timestamp !== null && <TimestampChip t={issue.timestamp} />}
      </div>
      <dl className="mt-4 grid gap-x-5 gap-y-3 sm:grid-cols-[120px_minmax(0,1fr)]">
        {rows
          .filter((r) => r.value)
          .map((row) => (
            <div key={row.label} className="contents">
              <dt className="label-mono pt-0.5 text-[10px] text-muted-foreground">{row.label}</dt>
              <dd
                className={cn(
                  "text-sm leading-relaxed",
                  row.strong ? "text-foreground" : "text-foreground/80",
                  row.quote && "border-l-2 border-lime/40 pl-3 text-foreground",
                )}
              >
                {row.value}
              </dd>
            </div>
          ))}
      </dl>
    </article>
  );
}
