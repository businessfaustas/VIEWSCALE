import { NextResponse } from "next/server";

import { jsonError, readJson } from "@/lib/api";
import { createAnalysisSchema, type AnalysisMetadata } from "@/lib/analysis/inputs";
import { getUser } from "@/lib/auth";
import type { Json } from "@/lib/database.types";
import { analysisFolder, videoExtension } from "@/lib/storage";
import { createClient } from "@/lib/supabase/server";

/** Unfinished uploads a user may have at once (each one can trigger a transcription). */
const MAX_IN_FLIGHT = 3;

/**
 * Creates the analysis row before the browser uploads anything, and returns
 * the Storage paths to upload to. Credits are only taken when analysis starts.
 */
export async function POST(request: Request) {
  const user = await getUser();
  if (!user) return jsonError("Sign in to analyze a video.", 401);

  const parsed = createAnalysisSchema.safeParse(await readJson(request));
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Invalid request", 400);
  }
  const input = parsed.data;

  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("credits")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile) return jsonError("Your profile is missing. Try signing out and back in.", 409);
  if (profile.credits < 1) {
    return jsonError("You're out of credits. Upgrade your plan to analyze more videos.", 402, {
      code: "insufficient_credits",
    });
  }

  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count } = await supabase
    .from("analyses")
    .select("id", { count: "exact", head: true })
    .in("status", ["uploading", "processing"])
    .gte("created_at", since);
  if ((count ?? 0) >= MAX_IN_FLIGHT) {
    return jsonError(
      "You have several uploads still in progress. Finish or wait for those before starting another.",
      429,
    );
  }

  const id = crypto.randomUUID();
  const folder = analysisFolder(user.id, id);
  const videoPath = `${folder}/video.${videoExtension(input.mimeType)}`;
  const thumbnailPath = `${folder}/thumbnail.jpg`;

  const metadata: AnalysisMetadata = {};
  if (input.caption) metadata.caption = input.caption;
  if (input.niche) metadata.niche = input.niche;
  if (input.goal) metadata.goal = input.goal;
  if (input.fileName) metadata.fileName = input.fileName;

  const performance = input.performance && Object.keys(input.performance).length ? input.performance : null;

  const { error } = await supabase.from("analyses").insert({
    id,
    platform: input.platform,
    duration: Math.round(input.duration * 100) / 100,
    metadata: metadata as Json,
    performance_data: performance as Json,
    video_path: videoPath,
    thumbnail_path: thumbnailPath,
  });
  if (error) return jsonError(`Couldn't start the analysis: ${error.message}`, 500);

  return NextResponse.json({ id, folder, videoPath, thumbnailPath });
}
