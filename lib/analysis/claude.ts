import "server-only";

import Anthropic from "@anthropic-ai/sdk";

import type { StoredTranscript } from "@/lib/analysis/inputs";
import { analysisJsonSchema } from "@/lib/analysis/output-schema";
import { AREA_IDS, analysisResultSchema, type AnalysisResult } from "@/lib/analysis/schema";
import { serverEnv } from "@/lib/env";
import { buildSystemPrompt, PROMPT_IS_PLACEHOLDER } from "@/lib/prompts/viewscale";
import { formatTimestamp } from "@/lib/utils";

export type FrameInput = { t: number; base64: string };

export type AnalysisContext = {
  platformLabel: string;
  duration: number;
  caption?: string;
  niche?: string;
  goal?: string;
  performance?: { views?: number; avgWatchPercent?: number; likes?: number; shares?: number } | null;
  transcript: StoredTranscript | null;
  frames: FrameInput[];
};

export class AnalysisError extends Error {}

const TRANSCRIPT_REASON: Record<string, string> = {
  no_audio: "the video has no audio track",
  silent: "the audio track is silent",
  unsupported: "the browser couldn't read the audio",
  failed: "transcription failed",
};

/** Inputs we know are missing; always reported in missingInputs. */
export function knownMissingInputs(ctx: AnalysisContext) {
  const missing: string[] = [];
  if (!ctx.transcript || ctx.transcript.status !== "ok") {
    const reason = TRANSCRIPT_REASON[ctx.transcript?.status ?? "failed"] ?? "transcription failed";
    missing.push(`Transcript (${reason}); audio and script judged from frames only`);
  }
  if (!ctx.caption) missing.push("Caption");
  if (!ctx.performance) missing.push("Real performance data (views, watch time, likes, shares)");
  return missing;
}

function buildUserContent(ctx: AnalysisContext): Anthropic.Beta.BetaContentBlockParam[] {
  const n = (v: number) => v.toLocaleString("en-US");
  const perf = ctx.performance
    ? [
        ctx.performance.views !== undefined && `views ${n(ctx.performance.views)}`,
        ctx.performance.avgWatchPercent !== undefined && `average watch ${ctx.performance.avgWatchPercent}%`,
        ctx.performance.likes !== undefined && `likes ${n(ctx.performance.likes)}`,
        ctx.performance.shares !== undefined && `shares ${n(ctx.performance.shares)}`,
      ]
        .filter(Boolean)
        .join(", ")
    : "None provided";

  let transcript: string;
  if (ctx.transcript?.status === "ok" && ctx.transcript.segments.length) {
    transcript = ctx.transcript.segments
      .map((s) => `[${s.start.toFixed(1)}s-${s.end.toFixed(1)}s] ${s.text}`)
      .join("\n");
  } else {
    const reason = TRANSCRIPT_REASON[ctx.transcript?.status ?? "failed"] ?? "transcription failed";
    transcript = `Unavailable: ${reason}. Judge audio and script from the frames only, and list the transcript in missingInputs.`;
  }

  const header = [
    "Analyze this short-form video.",
    "",
    `Platform: ${ctx.platformLabel}`,
    `Duration: ${ctx.duration.toFixed(1)}s (${formatTimestamp(ctx.duration)})`,
    `Caption: ${ctx.caption || "Not provided"}`,
    `Niche: ${ctx.niche || "Not provided"}`,
    `Goal: ${ctx.goal || "Not provided"}`,
    `Real performance data from the creator: ${perf}`,
    `Known missing inputs: ${knownMissingInputs(ctx).join("; ") || "None"}`,
    "",
    "Transcript (Whisper, timestamped segments):",
    transcript,
    "",
    `Frames: ${ctx.frames.length} frames follow, each labeled with its timestamp. They are sampled every 0.5s for the first 3s, then at wider intervals to the end.`,
  ].join("\n");

  const content: Anthropic.Beta.BetaContentBlockParam[] = [{ type: "text", text: header }];
  for (const frame of ctx.frames) {
    content.push({ type: "text", text: `Frame at ${frame.t.toFixed(1)}s (${formatTimestamp(frame.t)})` });
    content.push({
      type: "image",
      source: { type: "base64", media_type: "image/jpeg", data: frame.base64 },
    });
  }
  content.push({ type: "text", text: "Return the diagnosis as JSON now." });
  return content;
}

function validationMessage(issues: { path: PropertyKey[]; message: string }[]) {
  return issues
    .slice(0, 12)
    .map((i) => `- ${i.path.length ? i.path.join(".") : "(root)"}: ${i.message}`)
    .join("\n");
}

function parseResult(message: Anthropic.Beta.BetaMessage) {
  const textBlock = message.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    return { ok: false as const, error: "The response contained no JSON." };
  }
  let json: unknown;
  try {
    json = JSON.parse(textBlock.text);
  } catch {
    return {
      ok: false as const,
      error:
        message.stop_reason === "max_tokens"
          ? "The JSON was cut off before it finished."
          : "The response was not valid JSON.",
    };
  }
  const parsed = analysisResultSchema.safeParse(json);
  if (!parsed.success) return { ok: false as const, error: validationMessage(parsed.error.issues) };
  return { ok: true as const, data: parsed.data };
}

let warnedPlaceholder = false;

/**
 * Sends frames + transcript + context to Claude and returns a validated
 * result. Retries once, feeding the validation error back, if the JSON
 * doesn't pass the Zod schema.
 */
export async function runClaudeAnalysis(ctx: AnalysisContext): Promise<AnalysisResult> {
  if (PROMPT_IS_PLACEHOLDER && !warnedPlaceholder) {
    warnedPlaceholder = true;
    console.warn("[analyze] Using the interim prompt. Paste the ViewScale prompt into lib/prompts/viewscale.ts.");
  }

  const client = new Anthropic({ apiKey: serverEnv.anthropicApiKey, maxRetries: 2, timeout: 240_000 });
  const messages: Anthropic.Beta.BetaMessageParam[] = [
    { role: "user", content: buildUserContent(ctx) },
  ];

  for (let attempt = 1; attempt <= 2; attempt++) {
    const stream = client.beta.messages.stream({
      model: serverEnv.anthropicModel,
      max_tokens: 64000,
      // On a policy decline, the API re-runs the request on a fallback model.
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      system: [{ type: "text", text: buildSystemPrompt(), cache_control: { type: "ephemeral" } }],
      output_config: {
        effort: "high",
        format: { type: "json_schema", schema: analysisJsonSchema as unknown as Record<string, unknown> },
      },
      messages,
    });
    const message = await stream.finalMessage();

    console.info(
      `[analyze] attempt ${attempt}: model=${message.model} stop=${message.stop_reason} in=${message.usage.input_tokens} cache_read=${message.usage.cache_read_input_tokens ?? 0} out=${message.usage.output_tokens}`,
    );

    if (message.stop_reason === "refusal") {
      throw new AnalysisError("The model declined to analyze this video.");
    }

    const result = parseResult(message);
    if (result.ok) return result.data;
    if (attempt === 2) throw new AnalysisError(`The analysis came back in an invalid format.\n${result.error}`);

    // Append-only retry: keep the first reply (thinking blocks included) and ask for a fix.
    messages.push({ role: "assistant", content: message.content as Anthropic.Beta.BetaContentBlockParam[] });
    messages.push({
      role: "user",
      content: `Your JSON didn't pass validation:\n${result.error}\n\nReturn the complete corrected JSON. "areas" must contain exactly these 12 ids once each, in order: ${AREA_IDS.join(", ")}. "summary.topFixes" must have exactly 3 entries.`,
    });
  }
  throw new AnalysisError("The analysis didn't complete.");
}

/**
 * Makes the result safe to render: canonical area order, timestamps inside
 * the video, an integer score, and every known missing input listed.
 */
export function normalizeResult(result: AnalysisResult, duration: number, missing: string[]): AnalysisResult {
  const clamp = (t: number) => Math.min(Math.max(0, t), duration);
  const order = new Map(AREA_IDS.map((id, i) => [id, i]));

  const missingInputs = [...result.missingInputs];
  for (const item of missing) {
    const key = item.split(" ")[0].toLowerCase();
    if (!missingInputs.some((m) => m.toLowerCase().includes(key))) missingInputs.push(item);
  }

  return {
    ...result,
    overallScore: Math.round(Math.min(100, Math.max(0, result.overallScore))),
    areas: [...result.areas]
      .sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0))
      .map((area) => ({
        ...area,
        issues: area.issues.map((issue) => ({
          ...issue,
          timestamp: issue.timestamp === null ? null : clamp(issue.timestamp),
        })),
      })),
    dropOffRisks: result.dropOffRisks
      .filter((r) => r.timestamp >= 0 && r.timestamp <= duration + 0.5)
      .map((r) => ({ ...r, timestamp: clamp(r.timestamp) }))
      .sort((a, b) => a.timestamp - b.timestamp),
    missingInputs,
  };
}
