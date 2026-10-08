import "server-only";

import type { ReportData } from "@/components/report/report-view";
import { performanceSchema, type AnalysisMetadata } from "@/lib/analysis/inputs";
import { analysisResultSchema } from "@/lib/analysis/schema";
import type { Analysis } from "@/lib/database.types";

type Row = Pick<
  Analysis,
  "id" | "platform" | "created_at" | "duration" | "result" | "video_path" | "thumbnail_path"
> &
  Partial<Pick<Analysis, "metadata" | "performance_data" | "share_slug">>;

/** Turns a stored analysis row into what ReportView renders, or null if the result is unreadable. */
export function toReportData(
  row: Row,
  urls: { video: string | null; thumbnail: string | null },
  { includePrivate }: { includePrivate: boolean },
): ReportData | null {
  const result = analysisResultSchema.safeParse(row.result);
  if (!result.success) return null;

  const meta = (row.metadata ?? {}) as AnalysisMetadata;
  const performance = performanceSchema.safeParse(row.performance_data ?? undefined);

  return {
    id: row.id,
    platform: row.platform,
    createdAt: row.created_at,
    duration: Number(row.duration ?? 0),
    title: includePrivate ? meta.caption?.trim() || meta.fileName || null : null,
    result: result.data,
    videoUrl: urls.video,
    thumbnailUrl: urls.thumbnail,
    performance: includePrivate && performance.success && performance.data ? performance.data : null,
    shareSlug: includePrivate ? (row.share_slug ?? null) : null,
  };
}
