"use client";

import { useEffect } from "react";
import Link from "next/link";
import { RotateCcw, TriangleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";

type Props = {
  error: Error & { digest?: string };
  retry: () => void;
};

/**
 * Shown by the error.tsx boundaries. In production, Next.js hides server error
 * messages from the browser; the digest matches the full error in the server
 * logs (on Vercel: the project's Logs tab).
 */
export function ErrorState({ error, retry }: Props) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-xl px-4 py-20">
      <div role="alert" className="surface-card flex flex-col items-center p-8 text-center">
        <span className="inline-flex size-14 items-center justify-center rounded-2xl bg-danger/10 text-danger">
          <TriangleAlert className="size-6" aria-hidden="true" />
        </span>
        <h1 className="mt-5 text-xl tracking-tight">This page didn&apos;t load</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Something went wrong on the server. Try again in a moment. If it keeps happening, look up
          the error ID below in the server logs.
        </p>
        {process.env.NODE_ENV === "development" && (
          <p className="mt-4 w-full rounded-lg border border-border bg-background p-3 text-left font-mono text-xs break-words text-[#fca5a5]">
            {error.message}
          </p>
        )}
        {error.digest && (
          <p className="mt-4 font-mono text-[11px] text-muted-foreground">Error ID: {error.digest}</p>
        )}
        <div className="mt-6 flex flex-wrap justify-center gap-2.5">
          <Button onClick={() => retry()}>
            <RotateCcw className="size-4" aria-hidden="true" />
            Try again
          </Button>
          <Button asChild variant="secondary">
            <Link href="/">Go home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
