import { z } from "zod";

export const AREA_IDS = [
  "hook",
  "retention",
  "structure",
  "pacing",
  "clarity",
  "engagement",
  "triggers",
  "visual",
  "audio",
  "rewatch",
  "cta",
  "platformFit",
] as const;

export type AreaId = (typeof AREA_IDS)[number];

export const AREA_LABELS: Record<AreaId, string> = {
  hook: "Hook",
  retention: "Retention",
  structure: "Structure",
  pacing: "Pacing",
  clarity: "Clarity",
  engagement: "Engagement",
  triggers: "Psychological triggers",
  visual: "Visual",
  audio: "Audio",
  rewatch: "Rewatch value",
  cta: "Call to action",
  platformFit: "Platform fit",
};

export const RATINGS = ["strong", "ok", "weak", "not_assessed"] as const;
export type Rating = (typeof RATINGS)[number];

const issueSchema = z.object({
  problem: z.string().min(1),
  evidence: z.string(),
  timestamp: z.number().min(0).nullable(),
  whyItMatters: z.string(),
  fix: z.string().min(1),
  example: z.string(),
});

const areaSchema = z.object({
  id: z.enum(AREA_IDS),
  title: z.string().min(1),
  rating: z.enum(RATINGS),
  summary: z.string(),
  issues: z.array(issueSchema),
});

const dropOffRiskSchema = z.object({
  timestamp: z.number().min(0),
  severity: z.enum(["low", "medium", "high"]),
  reason: z.string().min(1),
});

/** The exact JSON shape Claude must return. Validated before anything is saved. */
export const analysisResultSchema = z
  .object({
    overallScore: z.number().min(0).max(100),
    areas: z.array(areaSchema),
    dropOffRisks: z.array(dropOffRiskSchema),
    summary: z.object({
      biggestStrength: z.string().min(1),
      biggestProblem: z.string().min(1),
      biggestOpportunity: z.string().min(1),
      topFixes: z.tuple([z.string().min(1), z.string().min(1), z.string().min(1)]),
      hookAlternatives: z.array(z.object({ angle: z.string().min(1), hook: z.string().min(1) })),
      whatToKeep: z.array(z.string()),
      finalVerdict: z.string().min(1),
    }),
    missingInputs: z.array(z.string()),
  })
  .superRefine((value, ctx) => {
    const seen = new Set(value.areas.map((a) => a.id));
    const missing = AREA_IDS.filter((id) => !seen.has(id));
    if (missing.length) {
      ctx.addIssue({
        code: "custom",
        path: ["areas"],
        message: `areas must include all 12 ids exactly once; missing: ${missing.join(", ")}`,
      });
    }
    if (seen.size !== value.areas.length) {
      ctx.addIssue({ code: "custom", path: ["areas"], message: "areas contains a duplicate id" });
    }
  });

export type AnalysisResult = z.infer<typeof analysisResultSchema>;
export type AnalysisArea = AnalysisResult["areas"][number];
export type AnalysisIssue = AnalysisArea["issues"][number];
