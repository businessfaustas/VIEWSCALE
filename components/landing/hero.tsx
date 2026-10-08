import Link from "next/link";
import { ArrowRight, Zap } from "lucide-react";

import { DashboardPreview } from "@/components/landing/dashboard-preview";
import { Button } from "@/components/ui/button";

const enter =
  "animate-in fade-in slide-in-from-bottom-3 fill-mode-both duration-700 ease-out motion-reduce:animate-none";

export function Hero() {
  return (
    <section aria-labelledby="hero-title" className="relative overflow-hidden">
      <div aria-hidden="true" className="bg-dot-grid pointer-events-none absolute inset-0" />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-[-180px] left-1/2 h-[420px] w-[720px] -translate-x-1/2 rounded-full bg-lime/[0.07] blur-[110px]"
      />

      <div className="relative mx-auto max-w-4xl px-4 pt-16 pb-14 text-center sm:px-6 sm:pt-24 sm:pb-20">
        <div className={enter}>
          <span className="inline-flex items-center gap-2 rounded-full border border-lime/25 bg-lime/[0.06] px-3.5 py-1.5 text-xs font-medium text-lime sm:text-[13px]">
            <Zap className="size-3.5 fill-lime" aria-hidden="true" />
            AI-Powered Content Diagnostics
          </span>
        </div>

        <h1
          id="hero-title"
          className={`${enter} mt-7 text-[2.4rem] leading-[1.04] font-bold tracking-[-0.04em] delay-100 sm:text-6xl lg:text-[4.5rem]`}
        >
          <span className="block text-balance text-foreground">Stop guessing why your</span>
          <span className="block text-balance text-gradient-lime pb-1">content doesn&apos;t scale.</span>
        </h1>

        <p
          className={`${enter} mx-auto mt-6 max-w-xl text-base leading-relaxed text-muted-foreground delay-200 sm:text-lg`}
        >
          ViewScale analyzes your videos and reveals what&apos;s blocking growth — with
          forensic-level diagnostics and prescriptive fixes.
        </p>

        <div
          className={`${enter} mt-9 flex flex-col items-stretch justify-center gap-3 delay-300 sm:flex-row sm:items-center`}
        >
          <Button asChild size="lg">
            <Link href="/upload">
              Analyze Your First Video
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="secondary">
            <Link href="/pricing">View Pricing</Link>
          </Button>
        </div>
      </div>

      <div className={`${enter} delay-500 duration-1000`}>
        <DashboardPreview />
      </div>
    </section>
  );
}
