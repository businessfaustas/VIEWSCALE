import { NextResponse } from "next/server";
import OpenAI, { toFile } from "openai";
import { z } from "zod";

import { jsonError, readJson } from "@/lib/api";
import { audioStatusSchema, type StoredTranscript } from "@/lib/analysis/inputs";
import { getUser } from "@/lib/auth";
import type { Json } from "@/lib/database.types";
import { serverEnv } from "@/lib/env";
import { analysisFolder, VIDEO_BUCKET } from "@/lib/storage";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const maxDuration = 120;

// 16 kHz mono 16-bit WAV for a 3:05 video, plus header.
const MAX_AUDIO_BYTES = 16_000 * 2 * 185 + 44;

const bodySchema = z.object({
  analysisId: z.uuid(),
  audio: audioStatusSchema,
});

/**
 * Transcribes the uploaded audio with Whisper and stores timestamped segments.
 * Failure is not fatal: the analysis continues from frames only and the
 * missing transcript is reported to Claude.
 */
export async function POST(request: Request) {
  const user = await getUser();
  if (!user) return jsonError("Sign in to continue.", 401);

  const parsed = bodySchema.safeParse(await readJson(request));
  if (!parsed.success) return jsonError("Invalid request", 400);
  const { analysisId, audio } = parsed.data;

  // RLS: only the owner can read the row.
  const supabase = await createClient();
  const { data: analysis } = await supabase
    .from("analyses")
    .select("id, user_id, status")
    .eq("id", analysisId)
    .maybeSingle();
  if (!analysis) return jsonError("Analysis not found.", 404);
  if (analysis.status !== "uploading") {
    return jsonError("This video has already been transcribed.", 409);
  }

  const admin = createAdminClient();
  const save = async (transcript: StoredTranscript) => {
    const { error } = await admin
      .from("analyses")
      .update({ transcript: transcript as Json, status: "processing" })
      .eq("id", analysisId)
      .eq("status", "uploading");
    if (error) throw new Error(error.message);
    return transcript;
  };

  if (audio !== "ok") {
    const stored = await save({ status: audio });
    return NextResponse.json({ status: stored.status });
  }

  const audioPath = `${analysisFolder(user.id, analysisId)}/audio.wav`;

  try {
    const { data: blob, error } = await admin.storage.from(VIDEO_BUCKET).download(audioPath);
    if (error || !blob) throw new Error("The audio file wasn't uploaded.");
    if (blob.size > MAX_AUDIO_BYTES) throw new Error("The audio track is longer than 3 minutes.");

    const openai = new OpenAI({ apiKey: serverEnv.openaiApiKey, timeout: 90_000, maxRetries: 1 });
    const result = await openai.audio.transcriptions.create({
      file: await toFile(blob, "audio.wav", { type: "audio/wav" }),
      model: "whisper-1",
      response_format: "verbose_json",
      timestamp_granularities: ["segment"],
    });

    const segments = (result.segments ?? [])
      .map((s) => ({
        start: Math.round(s.start * 100) / 100,
        end: Math.round(s.end * 100) / 100,
        text: s.text.trim(),
      }))
      .filter((s) => s.text);

    const stored = await save({
      status: "ok",
      text: result.text.trim(),
      language: result.language,
      segments,
    });
    return NextResponse.json({ status: stored.status, segments: segments.length });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Transcription failed";
    console.error("[transcribe]", analysisId, message);
    try {
      await save({ status: "failed", error: message.slice(0, 300) });
    } catch (saveErr) {
      console.error("[transcribe] couldn't record failure", saveErr);
    }
    // 200 on purpose: the client carries on with frames only.
    return NextResponse.json({ status: "failed", error: message });
  }
}
