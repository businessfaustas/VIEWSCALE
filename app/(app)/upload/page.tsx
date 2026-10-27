import { Suspense } from "react";
import type { Metadata } from "next";

import { SetupNotice } from "@/components/site/setup-notice";
import { UploadFlow } from "@/components/upload/upload-flow";
import { Skeleton } from "@/components/ui/skeleton";
import { requireUser } from "@/lib/auth";
import { getProfile } from "@/lib/data";

export const metadata: Metadata = { title: "Analyze a video" };

export default function UploadPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
      <header className="mb-8 sm:mb-10">
        <p className="label-mono text-lime">New analysis</p>
        <h1 className="mt-3 text-3xl tracking-[-0.03em] sm:text-4xl">Analyze a video</h1>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground sm:text-[15px]">
          Upload a TikTok, Reel or Short. ViewScale reads the frames and transcript, then shows
          what&apos;s limiting the video, with timestamps and exact fixes.
        </p>
      </header>
      <Suspense fallback={<UploadSkeleton />}>
        <Gate />
      </Suspense>
    </div>
  );
}

async function Gate() {
  await requireUser("/upload");
  const profile = await getProfile();
  if (!profile) return <SetupNotice kind="database" />;
  return <UploadFlow credits={profile.credits} />;
}

function UploadSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,320px)_1fr] lg:gap-10" aria-busy="true">
      <Skeleton className="aspect-[4/5] rounded-2xl sm:aspect-[9/12]" />
      <div className="space-y-7">
        <Skeleton className="h-[74px] rounded-2xl" />
        <Skeleton className="h-[260px] rounded-2xl" />
        <Skeleton className="h-[78px] rounded-2xl" />
        <Skeleton className="h-12 w-44" />
      </div>
    </div>
  );
}
