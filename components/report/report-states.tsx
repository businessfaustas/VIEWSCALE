"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, RotateCcw, TriangleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";

/** Shown while an analysis is still running; refreshes until it finishes. */
export function ProcessingState({ status }: { status: string }) {
  const router = useRouter();
  useEffect(() => {
    const id = window.setInterval(() => router.refresh(), 4000);
    return () => window.clearInterval(id);
  }, [router]);

  return (
    <div className="mx-auto max-w-xl px-4 py-20">
      <div className="surface-card flex flex-col items-center p-8 text-center" role="status">
        <span className="inline-flex size-14 items-center justify-center rounded-2xl bg-icon-tile text-lime">
          <Loader2 className="size-6 animate-spin" aria-hidden="true" />
        </span>
        <h1 className="mt-5 text-xl tracking-tight">
          {status === "analyzing" ? "Analyzing your video…" : "Still processing…"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {status === "uploading"
            ? "This upload didn't finish. If you closed the upload page, start a new analysis."
            : "This page updates on its own when the report is ready."}
        </p>
        {status === "uploading" && (
          <Button asChild className="mt-6">
            <Link href="/upload">New analysis</Link>
          </Button>
        )}
      </div>
    </div>
  );
}

export function FailedState({ message }: { message: string | null }) {
  return (
    <div className="mx-auto max-w-xl px-4 py-20">
      <div className="flex flex-col items-center rounded-2xl border border-danger/35 bg-danger/[0.05] p-8 text-center" role="alert">
        <span className="inline-flex size-14 items-center justify-center rounded-2xl bg-danger/10 text-danger">
          <TriangleAlert className="size-6" aria-hidden="true" />
        </span>
        <h1 className="mt-5 text-xl tracking-tight">This analysis failed</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {message || "Something went wrong while analyzing this video."} Your credit was returned.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2.5">
          <Button asChild>
            <Link href="/upload">
              <RotateCcw className="size-4" aria-hidden="true" />
              Try again
            </Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/dashboard">Back to dashboard</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
