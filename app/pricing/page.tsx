import { Suspense } from "react";
import type { Metadata } from "next";
import { Check } from "lucide-react";

import { CheckoutNotice } from "@/components/pricing/checkout-notice";
import { PlanButton } from "@/components/pricing/plan-button";
import { Footer } from "@/components/site/footer";
import { Navbar } from "@/components/site/navbar";
import { SectionHeading } from "@/components/site/section-heading";
import { Skeleton } from "@/components/ui/skeleton";
import type { Plan } from "@/lib/database.types";
import { getProfile } from "@/lib/data";
import { PLAN_ORDER, PLANS, type PlanConfig } from "@/lib/pricing";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Start with 3 free analyses. Upgrade when you post more.",
};

export default function PricingPage() {
  return (
    <>
      <Navbar />
      <main className="relative flex-1 overflow-hidden">
        <div aria-hidden="true" className="bg-dot-grid pointer-events-none absolute inset-x-0 top-0 h-[520px]" />
        <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <Suspense fallback={null}>
            <CheckoutNotice />
          </Suspense>
          <SectionHeading label="Pricing" title="Start free." accent="Upgrade when you post more." />
          <p className="mx-auto mt-5 max-w-lg text-center text-muted-foreground">
            Every plan gets the full diagnosis: 12 areas, timestamped problems and exact fixes. Paid
            plans add more analyses each month.
          </p>

          <ul className="mt-14 grid gap-4 lg:grid-cols-3">
            {PLAN_ORDER.map((id) => (
              <li key={id}>
                <PlanCard plan={PLANS[id]} />
              </li>
            ))}
          </ul>

          <p className="mx-auto mt-10 max-w-xl text-center text-xs leading-relaxed text-muted-foreground">
            Prices in USD. Paid plans renew monthly and credits reset at the start of each billing
            month (unused credits don&apos;t roll over). A failed analysis never uses a credit. Cancel
            anytime from billing.
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}

function PlanCard({ plan }: { plan: PlanConfig }) {
  return (
    <div
      className={cn(
        "relative flex h-full flex-col rounded-2xl border bg-card p-6 sm:p-7",
        plan.highlighted
          ? "border-lime/40 bg-gradient-to-b from-lime/[0.06] to-card shadow-[0_0_48px_-16px_rgba(184,255,60,0.4)]"
          : "border-border",
      )}
    >
      {plan.highlighted && (
        <span className="absolute -top-3 left-6 rounded-full bg-lime px-2.5 py-1 font-mono text-[10px] font-semibold tracking-wider text-primary-foreground uppercase">
          Recommended
        </span>
      )}
      <h2 className="text-lg font-semibold tracking-tight">{plan.name}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{plan.tagline}</p>
      <p className="mt-6 flex items-baseline gap-1.5">
        <span className="text-5xl font-bold tracking-[-0.04em]">${plan.priceMonthly}</span>
        <span className="text-sm text-muted-foreground">{plan.priceMonthly ? "/ month" : "forever"}</span>
      </p>
      <p className="label-mono mt-3 text-[10px] text-lime">
        {plan.id === "free" ? `${plan.credits} analyses included` : `${plan.credits} analyses / month`}
      </p>

      <ul className="mt-6 flex-1 space-y-3">
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-start gap-2.5 text-sm text-foreground/90">
            <Check className="mt-0.5 size-4 shrink-0 text-lime" aria-hidden="true" />
            {feature}
          </li>
        ))}
      </ul>

      <div className="mt-8">
        <Suspense fallback={<Skeleton className="h-11 w-full" />}>
          <PlanAction plan={plan} />
        </Suspense>
      </div>
    </div>
  );
}

async function PlanAction({ plan }: { plan: PlanConfig }) {
  const profile = await getProfile();
  const currentPlan: Plan | null = profile ? profile.plan : null;
  return (
    <PlanButton plan={plan.id} planName={plan.name} currentPlan={currentPlan} highlighted={plan.highlighted} />
  );
}
