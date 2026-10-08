import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";

export function FinalCta() {
  return (
    <section aria-labelledby="final-cta-title" className="mx-auto max-w-6xl px-4 pb-20 sm:px-6 sm:pb-28">
      <div className="relative overflow-hidden rounded-2xl border border-lime/20 bg-card px-6 py-16 text-center sm:px-12 sm:py-20">
        <div aria-hidden="true" className="bg-dot-grid pointer-events-none absolute inset-0 opacity-70" />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-40 left-1/2 h-80 w-[640px] -translate-x-1/2 rounded-full bg-lime/[0.14] blur-[100px]"
        />
        <div className="relative">
          <h2
            id="final-cta-title"
            className="text-[2rem] leading-[1.08] tracking-[-0.03em] sm:text-5xl"
          >
            <span className="block text-balance">Your next video deserves</span>
            <span className="block text-gradient-lime">better than guessing.</span>
          </h2>
          <p className="mx-auto mt-5 max-w-md text-base leading-relaxed text-muted-foreground sm:text-lg">
            Upload one video and see exactly what&apos;s holding it back. Your first 3 analyses
            are free.
          </p>
          <Button asChild size="lg" className="mt-9">
            <Link href="/upload">
              Start Free Analysis
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
