"use client";

import { AudioLines, Check, CircleSlash, CloudUpload, Film, Loader2, ScanSearch, Sparkles, X } from "lucide-react";

import { cn } from "@/lib/utils";

export const STEP_ORDER = ["upload", "frames", "transcribe", "analyze", "done"] as const;
export type StepId = (typeof STEP_ORDER)[number];
export type StepStatus = "pending" | "active" | "done" | "skipped" | "error";
export type StepState = { status: StepStatus; detail?: string; progress?: number };

const STEP_META: Record<StepId, { label: string; icon: typeof Film }> = {
  upload: { label: "Uploading", icon: CloudUpload },
  frames: { label: "Extracting frames", icon: Film },
  transcribe: { label: "Transcribing", icon: AudioLines },
  analyze: { label: "Analyzing", icon: ScanSearch },
  done: { label: "Done", icon: Sparkles },
};

export function ProgressSteps({ steps }: { steps: Record<StepId, StepState> }) {
  return (
    <ol className="space-y-2.5" aria-label="Analysis progress">
      {STEP_ORDER.map((id) => {
        const step = steps[id];
        const meta = STEP_META[id];
        const Icon = meta.icon;
        return (
          <li
            key={id}
            aria-current={step.status === "active" ? "step" : undefined}
            className={cn(
              "rounded-2xl border bg-card p-4 transition-colors",
              step.status === "active" && "border-lime/35",
              step.status === "error" && "border-danger/40",
              (step.status === "pending" || step.status === "done" || step.status === "skipped") && "border-border",
            )}
          >
            <div className="flex items-center gap-3.5">
              <span
                className={cn(
                  "inline-flex size-10 shrink-0 items-center justify-center rounded-xl",
                  step.status === "pending" ? "bg-surface-raised text-muted-foreground" : "bg-icon-tile text-lime",
                  step.status === "error" && "bg-danger/10 text-danger",
                )}
              >
                <Icon className="size-[18px]" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <p
                  className={cn(
                    "text-sm font-semibold",
                    step.status === "pending" ? "text-muted-foreground" : "text-foreground",
                  )}
                >
                  {meta.label}
                </p>
                {step.detail && (
                  <p
                    className={cn(
                      "mt-0.5 text-xs",
                      step.status === "error" ? "text-[#fca5a5]" : "text-muted-foreground",
                    )}
                  >
                    {step.detail}
                  </p>
                )}
              </div>
              <StatusIcon status={step.status} />
            </div>
            {step.status === "active" && typeof step.progress === "number" && (
              <div
                className="mt-3.5 h-1.5 overflow-hidden rounded-full bg-border"
                role="progressbar"
                aria-label={meta.label}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(step.progress)}
              >
                <div
                  className="h-full rounded-full bg-lime shadow-[0_0_12px_rgba(184,255,60,0.6)] transition-[width] duration-300"
                  style={{ width: `${Math.max(2, step.progress)}%` }}
                />
              </div>
            )}
          </li>
        );
      })}
    </ol>
  );
}

function StatusIcon({ status }: { status: StepStatus }) {
  switch (status) {
    case "active":
      return <Loader2 className="size-4 animate-spin text-lime" aria-label="In progress" />;
    case "done":
      return <Check className="size-4 text-lime" aria-label="Done" />;
    case "skipped":
      return <CircleSlash className="size-4 text-warning" aria-label="Skipped" />;
    case "error":
      return <X className="size-4 text-danger" aria-label="Failed" />;
    default:
      return <span className="size-4" aria-hidden="true" />;
  }
}
