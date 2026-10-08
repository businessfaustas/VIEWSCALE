import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";

import { ReportSkeleton } from "@/components/report/report-skeleton";
import { FailedState, ProcessingState } from "@/components/report/report-states";
import { ReportView } from "@/components/report/report-view";
import { toReportData } from "@/lib/analysis/report";
import { requireUser } from "@/lib/auth";
import { signPaths } from "@/lib/data";
import { publicEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Report" };

export default function AnalysisPage({ params }: PageProps<"/analysis/[id]">) {
  return (
    <Suspense fallback={<ReportSkeleton />}>
      <Report params={params} />
    </Suspense>
  );
}

async function Report({ params }: { params: PageProps<"/analysis/[id]">["params"] }) {
  const { id } = await params;
  await requireUser(`/analysis/${id}`);
  if (!z.uuid().safeParse(id).success) notFound();

  const supabase = await createClient();
  const { data: row } = await supabase.from("analyses").select("*").eq("id", id).maybeSingle();
  if (!row) notFound();

  if (row.status === "failed") return <FailedState message={row.error} />;
  if (row.status !== "complete") return <ProcessingState status={row.status} />;

  const paths = [row.video_path, row.thumbnail_path].filter((p): p is string => Boolean(p));
  const signed = await signPaths(paths, 60 * 60 * 2);
  const data = toReportData(
    row,
    {
      video: row.video_path ? (signed.get(row.video_path) ?? null) : null,
      thumbnail: row.thumbnail_path ? (signed.get(row.thumbnail_path) ?? null) : null,
    },
    { includePrivate: true },
  );
  if (!data) return <FailedState message="This report couldn't be read." />;

  return <ReportView mode="owner" data={data} siteUrl={publicEnv.siteUrl} />;
}
