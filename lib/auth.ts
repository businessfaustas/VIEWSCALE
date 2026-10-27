import "server-only";

import { redirect, unstable_rethrow } from "next/navigation";

import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export type SessionUser = { id: string; email: string | null };

/**
 * The signed-in user, or null. Reads cookies: call inside a Suspense boundary.
 * Never throws: with Supabase not configured or unreachable, the visitor is
 * treated as signed out instead of crashing the page.
 */
export async function getUser(): Promise<SessionUser | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getClaims();
    if (error || !data?.claims?.sub) return null;
    return { id: data.claims.sub, email: (data.claims.email as string | undefined) ?? null };
  } catch (err) {
    unstable_rethrow(err); // let Next.js prerender/redirect signals through
    console.error("[auth] couldn't read the session", err);
    return null;
  }
}

/** The signed-in user, or a redirect to sign-in. */
export async function requireUser(next?: string): Promise<SessionUser> {
  const user = await getUser();
  if (!user) redirect(next ? `/sign-in?next=${encodeURIComponent(next)}` : "/sign-in");
  return user;
}

/** Only allow same-site relative redirect targets. */
export function safeNext(next: string | null | undefined, fallback = "/dashboard") {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) {
    return fallback;
  }
  return next;
}
