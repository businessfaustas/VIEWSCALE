import { Plus } from "lucide-react";

import { ScoreRing } from "@/components/app/score-ring";
import { StatCard } from "@/components/app/stat-card";
import { WindowDots } from "@/components/landing/window-dots";
import { tools } from "@/lib/tools";
import { cn } from "@/lib/utils";

/**
 * Static, non-interactive picture of the dashboard for the hero.
 * All values are illustrative sample data.
 */
export function DashboardPreview() {
  return (
    <div
      aria-hidden="true"
      className="relative mx-auto max-w-5xl px-4 pb-20 select-none sm:px-6 sm:pb-28"
    >
      {/* lime glow behind the frame */}
      <div className="pointer-events-none absolute inset-x-[12%] top-[8%] bottom-[18%] rounded-[48px] bg-lime/25 blur-[90px]" />

      <div className="relative rounded-2xl border border-[#222a3d] bg-card/95 p-1.5 shadow-[0_30px_120px_-30px_rgba(184,255,60,0.35)] sm:p-2">
        <div className="flex h-9 items-center gap-3 px-3">
          <WindowDots />
          <span className="font-mono text-[11px] text-muted-foreground">viewscale / dashboard</span>
        </div>

        <div className="pointer-events-none rounded-xl border border-border bg-background p-4 sm:p-7">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xl font-bold tracking-tight sm:text-2xl">Dashboard</p>
              <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                Welcome back, Maya — <span className="text-foreground">3 free credits left</span>
              </p>
            </div>
            <span className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground shadow-glow sm:h-9 sm:px-4 sm:text-[13px]">
              <Plus className="size-3.5" strokeWidth={2.5} />
              New Analysis
            </span>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-2.5 sm:mt-6 sm:grid-cols-3 sm:gap-3">
            {tools.map((tool) => {
              const soon = tool.href === null;
              return (
                <div
                  key={tool.id}
                  className={cn(
                    "rounded-xl border bg-card p-3 sm:p-4",
                    tool.id === "analyze" ? "border-lime/35" : "border-border",
                  )}
                >
                  <div className="flex items-start justify-between">
                    <span
                      className={cn(
                        "inline-flex size-8 items-center justify-center rounded-lg bg-icon-tile sm:size-10 sm:rounded-xl",
                        soon ? "text-lime/50" : "text-lime",
                      )}
                    >
                      <tool.icon className="size-4 sm:size-5" strokeWidth={1.9} />
                    </span>
                    {soon && (
                      <span className="rounded-full border border-border px-1.5 py-0.5 font-mono text-[8px] tracking-wider text-muted-foreground uppercase sm:text-[9px]">
                        Soon
                      </span>
                    )}
                  </div>
                  <p
                    className={cn(
                      "mt-3 text-xs font-semibold sm:text-sm",
                      soon ? "text-foreground/60" : "text-foreground",
                    )}
                  >
                    {tool.title}
                  </p>
                  <p className="mt-1 hidden text-xs text-muted-foreground sm:block">
                    {tool.description}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="mt-6 flex gap-5 border-b border-border text-xs sm:text-sm">
            {["Overview", "Recent Analyses", "Insights"].map((tab, i) => (
              <span
                key={tab}
                className={cn(
                  "-mb-px border-b-2 pb-2.5 font-medium",
                  i === 0 ? "border-lime text-foreground" : "border-transparent text-muted-foreground",
                )}
              >
                {tab}
              </span>
            ))}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-5">
            <StatCard label="Avg score" className="col-span-2 flex-row items-center lg:col-span-1 lg:flex-col lg:items-start">
              <ScoreRing score={64} size={64} strokeWidth={6} />
            </StatCard>
            <StatCard label="Videos analyzed">
              <p className="text-2xl font-bold tracking-tight">12</p>
            </StatCard>
            <StatCard label="Best score">
              <p className="text-2xl font-bold tracking-tight text-lime">84</p>
            </StatCard>
            <StatCard label="Top issue">
              <p className="text-base font-semibold text-warning">Weak hook</p>
            </StatCard>
            <StatCard label="Credits left">
              <p className="text-2xl font-bold tracking-tight">3</p>
            </StatCard>
          </div>
        </div>
      </div>
    </div>
  );
}
