import "server-only";

import { cache } from "react";

import { getUser } from "@/lib/auth";
import type { Analysis, Profile } from "@/lib/database.types";
import { VIDEO_BUCKET } from "@/lib/storage";
import { createClient } from "@/lib/supabase/server";

export type ProfileWithEmail = Profile & { email: string | null };

/** The signed-in user's profile, deduplicated per request. */
export const getProfile = cache(async (): Promise<ProfileWithEmail | null> => {
  const user = await getUser();
  if (!user) return null;
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  return data ? { ...data, email: user.email } : null;
});

export type AnalysisListItem = Pick<
  Analysis,
  "id" | "platform" | "score" | "status" | "created_at" | "thumbnail_path" | "duration"
> & {
  result: Analysis["result"];
  thumbnailUrl: string | null;
  title: string | null;
};

/** The user's most recent analyses with signed thumbnail URLs. */
export const getAnalyses = cache(async (limit = 50): Promise<AnalysisListItem[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("analyses")
    .select("id, platform, score, status, created_at, thumbnail_path, duration, result, metadata")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(`Couldn't load your analyses: ${error.message}`);

  const rows = data ?? [];
  const paths = rows.map((r) => r.thumbnail_path).filter((p): p is string => Boolean(p));
  const signed = await signPaths(paths);

  return rows.map(({ metadata, ...row }) => {
    const meta = (metadata ?? {}) as { caption?: string; fileName?: string };
    return {
      ...row,
      thumbnailUrl: row.thumbnail_path ? (signed.get(row.thumbnail_path) ?? null) : null,
      title: meta.caption?.trim() || meta.fileName || null,
    };
  });
});

/** Signs private Storage paths for one hour. Missing files are skipped. */
export async function signPaths(paths: string[], expiresIn = 3600) {
  const map = new Map<string, string>();
  if (!paths.length) return map;
  const supabase = await createClient();
  const { data } = await supabase.storage.from(VIDEO_BUCKET).createSignedUrls(paths, expiresIn);
  for (const item of data ?? []) {
    if (item.path && item.signedUrl) map.set(item.path, item.signedUrl);
  }
  return map;
}
