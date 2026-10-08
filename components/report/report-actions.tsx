"use client";

import { useState, useTransition } from "react";
import { Check, Download, Link2, Loader2, X } from "lucide-react";

import { createShareLink, revokeShareLink } from "@/app/(app)/analysis/[id]/actions";
import { PREPARE_PRINT_EVENT } from "@/components/charts/drop-off-chart";
import { Button } from "@/components/ui/button";

/** Opens every accordion and draws charts, then opens the print dialog ("Save as PDF"). */
export function exportPdf() {
  window.dispatchEvent(new Event(PREPARE_PRINT_EVENT));
  const closed = Array.from(document.querySelectorAll<HTMLDetailsElement>("details:not([open])"));
  closed.forEach((d) => (d.open = true));
  const restore = () => {
    closed.forEach((d) => (d.open = false));
    window.removeEventListener("afterprint", restore);
  };
  window.addEventListener("afterprint", restore);
  // Give the chart a moment to measure and render before the print snapshot.
  window.setTimeout(() => window.print(), 450);
}

export function ExportPdfButton() {
  return (
    <Button type="button" variant="secondary" size="sm" onClick={exportPdf}>
      <Download className="size-4" aria-hidden="true" />
      Export as PDF
    </Button>
  );
}

export function ReportActions({
  analysisId,
  initialSlug,
  siteUrl,
}: {
  analysisId: string;
  initialSlug: string | null;
  /** Public base URL for share links (NEXT_PUBLIC_SITE_URL). */
  siteUrl: string;
}) {
  const [slug, setSlug] = useState(initialSlug);
  const [status, setStatus] = useState<"idle" | "copied" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const url = slug ? `${siteUrl}/share/${slug}` : null;

  function share() {
    startTransition(async () => {
      const result = await createShareLink(analysisId);
      if ("error" in result) {
        setStatus("error");
        setMessage(result.error);
        return;
      }
      setSlug(result.slug);
      const link = `${siteUrl}/share/${result.slug}`;
      try {
        await navigator.clipboard.writeText(link);
        setStatus("copied");
        setMessage("Link copied. Anyone with it can view this report.");
      } catch {
        setStatus("idle");
        setMessage("Anyone with this link can view this report.");
      }
    });
  }

  function revoke() {
    startTransition(async () => {
      const { ok } = await revokeShareLink(analysisId);
      if (ok) {
        setSlug(null);
        setStatus("idle");
        setMessage("Sharing turned off. The old link no longer works.");
      }
    });
  }

  return (
    <div className="space-y-3 print:hidden">
      <div className="flex flex-wrap gap-2.5">
        <ExportPdfButton />
        <Button type="button" variant="secondary" size="sm" onClick={share} disabled={pending}>
          {pending ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : status === "copied" ? (
            <Check className="size-4 text-lime" aria-hidden="true" />
          ) : (
            <Link2 className="size-4" aria-hidden="true" />
          )}
          {slug ? "Copy share link" : "Share link"}
        </Button>
      </div>
      {(message || url) && (
        <div className="space-y-1.5 text-xs" aria-live="polite">
          {message && (
            <p className={status === "error" ? "text-[#fca5a5]" : "text-muted-foreground"}>{message}</p>
          )}
          {url && (
            <div className="flex items-center gap-2">
              <code className="min-w-0 truncate rounded-md border border-border bg-background px-2 py-1 font-mono text-[11px] text-foreground/90">
                {url}
              </code>
              <button
                type="button"
                onClick={revoke}
                disabled={pending}
                className="inline-flex shrink-0 cursor-pointer items-center gap-1 text-muted-foreground hover:text-foreground"
              >
                <X className="size-3.5" aria-hidden="true" />
                Stop sharing
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
