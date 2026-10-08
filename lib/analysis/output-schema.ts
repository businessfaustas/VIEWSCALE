import { AREA_IDS, RATINGS } from "@/lib/analysis/schema";

/**
 * JSON Schema sent to the API as structured output (output_config.format), so
 * the response is always parseable JSON of the right shape. It mirrors
 * analysisResultSchema; constraints the API can't express (exactly 12 areas,
 * exactly 3 fixes, number ranges) are checked by Zod after the response.
 */
const text = { type: "string" } as const;

const issue = {
  type: "object",
  additionalProperties: false,
  required: ["problem", "evidence", "timestamp", "whyItMatters", "fix", "example"],
  properties: {
    problem: text,
    evidence: text,
    timestamp: {
      anyOf: [{ type: "number" }, { type: "null" }],
      description: "Seconds from the start of the video, or null",
    },
    whyItMatters: text,
    fix: text,
    example: text,
  },
} as const;

export const analysisJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["overallScore", "areas", "dropOffRisks", "summary", "missingInputs"],
  properties: {
    overallScore: { type: "number", description: "0 to 100" },
    areas: {
      type: "array",
      description: `Exactly 12 entries, in this order: ${AREA_IDS.join(", ")}`,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "title", "rating", "summary", "issues"],
        properties: {
          id: { type: "string", enum: [...AREA_IDS] },
          title: text,
          rating: { type: "string", enum: [...RATINGS] },
          summary: text,
          issues: { type: "array", items: issue },
        },
      },
    },
    dropOffRisks: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["timestamp", "severity", "reason"],
        properties: {
          timestamp: { type: "number", description: "Seconds from the start" },
          severity: { type: "string", enum: ["low", "medium", "high"] },
          reason: { type: "string", description: "Under 6 words" },
        },
      },
    },
    summary: {
      type: "object",
      additionalProperties: false,
      required: [
        "biggestStrength",
        "biggestProblem",
        "biggestOpportunity",
        "topFixes",
        "hookAlternatives",
        "whatToKeep",
        "finalVerdict",
      ],
      properties: {
        biggestStrength: text,
        biggestProblem: text,
        biggestOpportunity: text,
        topFixes: { type: "array", items: text, description: "Exactly 3, most impactful first" },
        hookAlternatives: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            required: ["angle", "hook"],
            properties: { angle: text, hook: text },
          },
        },
        whatToKeep: { type: "array", items: text },
        finalVerdict: text,
      },
    },
    missingInputs: { type: "array", items: text },
  },
} as const;
