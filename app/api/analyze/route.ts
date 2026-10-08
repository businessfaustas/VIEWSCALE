import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";

import { jsonError, readJson } from "@/lib/api";
import {
  AnalysisError,
  knownMissingInputs,
  normalizeResult,
  runClaudeAnalysis,
  type AnalysisContext,
} from "@/lib/analysis/claude";
import { performanceSchema, type AnalysisMetadata, type StoredTranscript } from "@/lib/analysis/inputs";
import { getUser } from "@/lib/auth";
import type { Json } from "@/lib/database.types";
import { platformLong } from "@/lib/platforms";
import { analysisFolder, VIDEO_BUCKET } from "@/lib/storage";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { MAX_FRAMES } from "@/lib/video/frames";

// Claude reviewing up to 40 frames can take a couple of minutes.
export const maxDuration = 300;

const bodySchema = z.object({
  analysisId: z.uuid(),
  frames: z
    .array(z.object({ t: z.number().min(0), path: z.string().max(300) }))
    .min(1)
    .max(MAX_FRAMES),
});

function friendlyError(err: unknown) {
  if (err instanceof AnalysisError) return err.message;
  if (err instanceof Anthropic.RateLimitError) return "The analysis service is busy right now. Try again in a minute.";
  if (err instanceof Anthropic.AuthenticationError) return "The analysis service isn't configured correctly (API key).";
  if (err instanceof Anthropic.APIConnectionError) return "Couldn't reach the analysis service. Try again.";
  if (err instanceof Anthropic.APIError) return `The analysis service returned an error (${err.status}).`;
  if (err instanceof Error && err.message.startsWith("Missing environment variable")) return err.message;
  return "The analysis didn't complete.";
}

/**
 * Runs the Claude analysis for an uploaded video. Takes one credit atomically
 * before calling Claude and refunds it if anything fails.
 */
export async function POST(request: Request) {
  const user = await getUser();
  if (!user) return jsonError("Sign in to continue.", 401);

  const parsed = bodySchema.safeParse(await readJson(request));
  if (!parsed.success) return jsonError("Invalid request", 400);
  const { analysisId } = parsed.data;

  // RLS: only the owner can read the row.
  const supabase = await createClient();
  const { data: analysis } = await supabase
    .from("analyses")
    .select("id, platform, duration, metadata, performance_data, transcript, status")
    .eq("id", analysisId)
    .maybeSingle();
  if (!analysis) return jsonError("Analysis not found.", 404);
  if (analysis.status === "complete") return NextResponse.json({ id: analysisId, status: "complete" });
  if (analysis.status === "analyzing") return jsonError("This video is already being analyzed.", 409);
  if (analysis.status === "uploading") return jsonError("The upload hasn't finished yet.", 409);

  const duration = Number(analysis.duration ?? 0);
  const framesPrefix = `${analysisFolder(user.id, analysisId)}/frames/`;
  const frames = parsed.data.frames
    .filter((f) => f.path.startsWith(framesPrefix) && /^\d{2}\.jpg$/.test(f.path.slice(framesPrefix.length)))
    .map((f) => ({ t: Math.min(f.t, duration), path: f.path }))
    .sort((a, b) => a.t - b.t);
  if (!frames.length) return jsonError("No frames were provided for this video.", 400);

  const admin = createAdminClient();

  const { error: chargeError } = await admin.rpc("consume_credit", { p_analysis_id: analysisId });
  if (chargeError) {
    if (chargeError.message.includes("insufficient_credits")) {
      return jsonError("You're out of credits. Upgrade your plan to analyze more videos.", 402, {
        code: "insufficient_credits",
      });
    }
    if (chargeError.message.includes("already_charged")) {
      return jsonError("This video is already being analyzed.", 409);
    }
    return jsonError(`Couldn't start the analysis: ${chargeError.message}`, 500);
  }

  try {
    const images = await Promise.all(
      frames.map(async (f) => {
        const { data, error } = await admin.storage.from(VIDEO_BUCKET).download(f.path);
        if (error || !data) throw new AnalysisError("Some frames are missing from storage. Upload the video again.");
        return { t: f.t, base64: Buffer.from(await data.arrayBuffer()).toString("base64") };
      }),
    );

    const meta = (analysis.metadata ?? {}) as AnalysisMetadata;
    const performance = performanceSchema.safeParse(analysis.performance_data ?? undefined);
    const ctx: AnalysisContext = {
      platformLabel: platformLong(analysis.platform),
      duration,
      caption: meta.caption,
      niche: meta.niche,
      goal: meta.goal,
      performance: performance.success && performance.data ? performance.data : null,
      transcript: (analysis.transcript as StoredTranscript | null) ?? null,
      frames: images,
    };

    const result = normalizeResult(await runClaudeAnalysis(ctx), duration, knownMissingInputs(ctx));

    const { error: saveError } = await admin
      .from("analyses")
      .update({
        result: result as unknown as Json,
        score: result.overallScore,
        status: "complete",
        frames: frames as unknown as Json,
        error: null,
      })
      .eq("id", analysisId);
    if (saveError) throw new AnalysisError(`Couldn't save the analysis: ${saveError.message}`);

    return NextResponse.json({ id: analysisId, status: "complete", score: result.overallScore });
  } catch (err) {
    console.error("[analyze]", analysisId, err);
    const message = friendlyError(err);
    const { data: refunded } = await admin.rpc("refund_credit", { p_analysis_id: analysisId });
    await admin
      .from("analyses")
      .update({ status: "failed", error: message.slice(0, 500), frames: frames as unknown as Json })
      .eq("id", analysisId);
    return jsonError(
      `${message} ${refunded ? "Your credit was refunded." : ""}`.trim(),
      502,
      { code: "analysis_failed", refunded: Boolean(refunded) },
    );
  }
}
