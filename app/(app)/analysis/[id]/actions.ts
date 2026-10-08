"use server";

import { randomBytes } from "node:crypto";
import { z } from "zod";

import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type ShareResult = { slug: string } | { error: string };

/** Returns the analysis's public share slug, creating a random one if needed. */
export async function createShareLink(analysisId: string): Promise<ShareResult> {
  if (!z.uuid().safeParse(analysisId).success) return { error: "Invalid analysis." };
  const user = await getUser();
  if (!user) return { error: "Sign in to share." };

  const supabase = await createClient();
  const { data: row } = await supabase
    .from("analyses")
    .select("share_slug, status")
    .eq("id", analysisId)
    .maybeSingle();
  if (!row) return { error: "Analysis not found." };
  if (row.status !== "complete") return { error: "Only finished reports can be shared." };
  if (row.share_slug) return { slug: row.share_slug };

  // 24 random bytes -> 32 URL-safe characters; unguessable.
  const slug = randomBytes(24).toString("base64url");
  const { error } = await supabase.from("analyses").update({ share_slug: slug }).eq("id", analysisId);
  if (error) return { error: "Couldn't create a share link. Try again." };
  return { slug };
}

/** Turns the public link off. The old URL stops working immediately. */
export async function revokeShareLink(analysisId: string): Promise<{ ok: boolean }> {
  if (!z.uuid().safeParse(analysisId).success) return { ok: false };
  const user = await getUser();
  if (!user) return { ok: false };
  const supabase = await createClient();
  const { error } = await supabase.from("analyses").update({ share_slug: null }).eq("id", analysisId);
  return { ok: !error };
}
