import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ReportSkeleton } from "@/components/report/report-skeleton";
import { ReportView } from "@/components/report/report-view";
import { Footer } from "@/components/site/footer";
import { Navbar } from "@/components/site/navbar";
import { toReportData } from "@/lib/analysis/report";
import { VIDEO_BUCKET } from "@/lib/storage";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Shared report",
  robots: { index: false, follow: false },
};

export default function SharedReportPage({ params }: PageProps<"/share/[slug]">) {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        <Suspense fallback={<ReportSkeleton />}>
          <SharedReport params={params} />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}

async function SharedReport({ params }: { params: PageProps<"/share/[slug]">["params"] }) {
  const { slug } = await params;
  if (!/^[A-Za-z0-9_-]{16,64}$/.test(slug)) notFound();

  // Public read by exact slug only (SECURITY DEFINER function, no table access).
  const supabase = await createClient();
  const { data } = await supabase.rpc("get_shared_analysis", { p_slug: slug });
  const row = data?.[0];
  if (!row) notFound();

  // The files are private; sign them server-side for this view only.
  const admin = createAdminClient();
  const sign = async (path: string | null) => {
    if (!path) return null;
    const { data: signed } = await admin.storage.from(VIDEO_BUCKET).createSignedUrl(path, 60 * 60);
    return signed?.signedUrl ?? null;
  };
  const [video, thumbnail] = await Promise.all([sign(row.video_path), sign(row.thumbnail_path)]);

  const report = toReportData(row, { video, thumbnail }, { includePrivate: false });
  if (!report) notFound();

  return <ReportView mode="shared" data={report} />;
}
