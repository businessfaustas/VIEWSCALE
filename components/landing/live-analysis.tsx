import { DropOffChart } from "@/components/charts/drop-off-chart";
import { WindowDots } from "@/components/landing/window-dots";
import { SectionHeading } from "@/components/site/section-heading";
import { buildRiskCurve, type DropOffRisk } from "@/lib/drop-off";
import { cn } from "@/lib/utils";

/** Hardcoded demo data for the landing page preview. */
const DEMO_DURATION = 30;
const DEMO_RISKS: DropOffRisk[] = [
  { timestamp: 3, severity: "high", reason: "Weak hook" },
  { timestamp: 12, severity: "high", reason: "Pacing dip" },
  { timestamp: 24, severity: "high", reason: "CTA buried" },
];

const metrics = [
  { label: "Hook score", value: "42", tone: "text-warning" },
  { label: "Drop-offs", value: "3", tone: "text-danger" },
  { label: "CTA strength", value: "Low", tone: "text-danger" },
] as const;

export function LiveAnalysis() {
  const { average } = buildRiskCurve(DEMO_RISKS, DEMO_DURATION);

  return (
    <section
      aria-labelledby="live-analysis-title"
      className="mx-auto max-w-5xl px-4 py-20 sm:px-6 sm:py-28"
    >
      <SectionHeading
        id="live-analysis-title"
        label="Live analysis preview"
        title="Watch ViewScale dissect a video"
        accent="in real time."
      />

      <div className="relative mt-12 sm:mt-16">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-[15%] top-1/4 bottom-0 rounded-full bg-lime/[0.08] blur-[100px]"
        />
        <div className="surface-card relative overflow-hidden">
          <div className="flex h-11 items-center justify-between gap-3 border-b border-border px-4">
            <div className="flex min-w-0 items-center gap-3">
              <WindowDots />
              <span className="truncate font-mono text-[11px] text-muted-foreground sm:text-xs">
                <span className="hidden sm:inline">viewscale / </span>live-analysis.tsx
              </span>
            </div>
            <span className="inline-flex shrink-0 items-center gap-2 rounded-full border border-lime/25 bg-lime/[0.07] px-2.5 py-1">
              <span className="relative flex size-1.5">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-lime opacity-75 motion-reduce:animate-none" />
                <span className="relative inline-flex size-1.5 rounded-full bg-lime" />
              </span>
              <span className="font-mono text-[10px] font-medium tracking-[0.18em] text-lime">
                ANALYZING
              </span>
            </span>
          </div>

          <div className="p-4 sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-base font-semibold tracking-tight sm:text-lg">Drop-off Risk</h3>
                <p className="mt-0.5 text-xs text-muted-foreground">Sample 0:30 video</p>
              </div>
              <div className="text-right">
                <p className="label-mono text-[10px] text-muted-foreground">Avg</p>
                <p className="mt-0.5 font-mono text-lg font-semibold text-foreground">{average}%</p>
              </div>
            </div>

            <DropOffChart
              risks={DEMO_RISKS}
              duration={DEMO_DURATION}
              height={260}
              className="mt-2"
            />

            <div className="mt-5 grid grid-cols-3 gap-2.5 sm:mt-6 sm:gap-4">
              {metrics.map((m) => (
                <div
                  key={m.label}
                  className="flex flex-col justify-between rounded-xl border border-border bg-background/60 px-3 py-3.5 sm:px-5 sm:py-4"
                >
                  <p className="label-mono text-[9px] leading-tight text-muted-foreground sm:text-[10px]">
                    {m.label}
                  </p>
                  <p
                    className={cn(
                      "mt-2 text-2xl font-bold tracking-tight sm:text-3xl",
                      m.tone,
                    )}
                  >
                    {m.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
