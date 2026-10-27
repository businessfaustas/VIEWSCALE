import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { BarChart3, Plus, Video } from "lucide-react";

import { ScoreRing } from "@/components/app/score-ring";
import { CheckoutNotice } from "@/components/pricing/checkout-notice";
import { StatCard } from "@/components/app/stat-card";
import { AnalysisList } from "@/components/dashboard/analysis-list";
import { DashboardTabs } from "@/components/dashboard/dashboard-tabs";
import { Insights } from "@/components/dashboard/insights";
import { ToolGrid } from "@/components/dashboard/tool-grid";
import { SetupNotice } from "@/components/site/setup-notice";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { areaBreakdown, dashboardStats } from "@/lib/analysis/stats";
import { requireUser } from "@/lib/auth";
import { getAnalyses, getProfile, isMissingSchema } from "@/lib/data";
import { cn, scoreTone, toneText } from "@/lib/utils";

export const metadata: Metadata = { title: "Dashboard" };

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <Suspense fallback={null}>
        <CheckoutNotice />
      </Suspense>
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl tracking-[-0.03em] sm:text-4xl">Dashboard</h1>
          <Suspense fallback={<Skeleton className="mt-2.5 h-5 w-72 max-w-full" />}>
            <Welcome />
          </Suspense>
        </div>
        <Button asChild>
          <Link href="/upload">
            <Plus className="size-4" strokeWidth={2.5} aria-hidden="true" />
            New Analysis
          </Link>
        </Button>
      </div>

      <ToolGrid className="mt-8" />

      <section aria-label="Your analyses" className="mt-10">
        <Suspense fallback={<TabsSkeleton />}>
          <DashboardData />
        </Suspense>
      </section>
    </div>
  );
}

async function Welcome() {
  await requireUser("/dashboard");
  const profile = await getProfile();
  const name = profile?.name?.split(" ")[0] || "creator";
  const credits = profile?.credits ?? 0;
  const free = !profile || profile.plan === "free";
  return (
    <p className="mt-2 text-sm text-muted-foreground sm:text-[15px]">
      Welcome back, {name} —{" "}
      <span className="text-foreground">
        {credits} {free ? "free " : ""}
        {credits === 1 ? "credit" : "credits"} left
      </span>
    </p>
  );
}

async function DashboardData() {
  await requireUser("/dashboard");
  let profile, analyses;
  try {
    [profile, analyses] = await Promise.all([getProfile(), getAnalyses()]);
  } catch (err) {
    if (isMissingSchema(err)) return <SetupNotice kind="database" />;
    throw err;
  }
  if (!profile) return <SetupNotice kind="database" />;
  const stats = dashboardStats(analyses);
  const breakdown = areaBreakdown(analyses);

  if (!analyses.length) {
    return (
      <DashboardTabs
        overview={<Overview stats={stats} credits={profile?.credits ?? 0} empty />}
        recent={<EmptyState />}
        insights={<EmptyState insights />}
      />
    );
  }

  return (
    <DashboardTabs
      overview={
        <div className="space-y-8">
          <Overview stats={stats} credits={profile?.credits ?? 0} />
          <div>
            <h2 className="label-mono text-muted-foreground">Latest</h2>
            <div className="mt-3">
              <AnalysisList items={analyses.slice(0, 3)} />
            </div>
          </div>
        </div>
      }
      recent={<AnalysisList items={analyses} />}
      insights={breakdown.length ? <Insights rows={breakdown} /> : <EmptyState insights />}
    />
  );
}

function Overview({
  stats,
  credits,
  empty = false,
}: {
  stats: ReturnType<typeof dashboardStats>;
  credits: number;
  empty?: boolean;
}) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
        <StatCard
          label="Average score"
          className="col-span-2 flex-row items-center lg:col-span-1 lg:flex-col lg:items-start"
        >
          {stats.averageScore !== null ? (
            <ScoreRing score={stats.averageScore} size={76} strokeWidth={7} />
          ) : (
            <p className="text-2xl font-bold text-muted-foreground">—</p>
          )}
        </StatCard>
        <StatCard label="Videos analyzed">
          <p className="text-3xl font-bold tracking-tight">{stats.analyzed}</p>
        </StatCard>
        <StatCard label="Best score">
          <p
            className={cn(
              "text-3xl font-bold tracking-tight",
              stats.bestScore !== null ? toneText[scoreTone(stats.bestScore)] : "text-muted-foreground",
            )}
          >
            {stats.bestScore ?? "—"}
          </p>
        </StatCard>
        <StatCard label="Top issue">
          <p
            className={cn(
              "text-lg leading-tight font-semibold",
              stats.topIssue ? "text-warning" : "text-muted-foreground",
            )}
          >
            {stats.topIssue ?? "None yet"}
          </p>
        </StatCard>
        <StatCard label="Credits left">
          <p className="text-3xl font-bold tracking-tight">{credits}</p>
        </StatCard>
      </div>
      {empty && <EmptyState />}
    </div>
  );
}

function EmptyState({ insights = false }: { insights?: boolean }) {
  const Icon = insights ? BarChart3 : Video;
  return (
    <div className="surface-card flex flex-col items-center px-6 py-12 text-center">
      <span className="inline-flex size-14 items-center justify-center rounded-2xl bg-icon-tile text-lime">
        <Icon className="size-6" aria-hidden="true" />
      </span>
      <h3 className="mt-5 text-lg font-semibold">
        {insights ? "Insights build up as you analyze" : "No analyses yet"}
      </h3>
      <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
        {insights
          ? "Once you have a completed analysis, you'll see which areas hold your videos back most often."
          : "Upload a short-form video to get a timestamped diagnosis and exact fixes."}
      </p>
      <Button asChild className="mt-6">
        <Link href="/upload">Analyze your first video</Link>
      </Button>
    </div>
  );
}

function TabsSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading your analyses">
      <div className="flex gap-6 border-b border-border pb-3">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-4 w-16" />
      </div>
      <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
        <Skeleton className="col-span-2 h-[132px] rounded-2xl lg:col-span-1" />
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-[132px] rounded-2xl" />
        ))}
      </div>
      <div className="mt-8 space-y-2.5">
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton key={i} className="h-[90px] rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
