"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import { safeNext } from "@/lib/auth";
import { isSupabaseConfigured, publicEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export type AuthState = { error?: string; message?: string; email?: string; name?: string };

const NOT_CONNECTED =
  "Sign-in isn't connected yet. Add the Supabase URL and anon key to the environment variables, then redeploy.";

async function siteOrigin() {
  const origin = (await headers()).get("origin");
  return origin ?? publicEnv.siteUrl;
}

const signInSchema = z.object({
  email: z.email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password."),
});

export async function signInWithPassword(_: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!isSupabaseConfigured()) return { error: NOT_CONNECTED, email };
  const parsed = signInSchema.safeParse({ email, password: formData.get("password") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message, email };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    const message =
      error.code === "email_not_confirmed"
        ? "Confirm your email first. We sent you a link when you signed up."
        : error.code === "invalid_credentials"
          ? "That email and password don't match."
          : error.message;
    return { error: message, email };
  }

  redirect(safeNext(formData.get("next") as string | null));
}

const signUpSchema = z.object({
  name: z.string().trim().min(1, "Tell us your name.").max(80, "Keep your name under 80 characters."),
  email: z.email("Enter a valid email address."),
  password: z.string().min(8, "Use at least 8 characters for your password."),
});

export async function signUp(_: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const name = String(formData.get("name") ?? "");
  if (!isSupabaseConfigured()) return { error: NOT_CONNECTED, email, name };
  const parsed = signUpSchema.safeParse({ name, email, password: formData.get("password") });
  // Echo inputs back: React resets the form after an action runs.
  if (!parsed.success) return { error: parsed.error.issues[0]?.message, email, name };

  const next = safeNext(formData.get("next") as string | null);
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { name: parsed.data.name },
      emailRedirectTo: `${await siteOrigin()}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });
  if (error) return { error: error.message, email, name };

  // Email confirmation disabled in Supabase: the user is signed in already.
  if (data.session) redirect(next);

  return { message: `We sent a confirmation link to ${parsed.data.email}. Open it to finish signing up.` };
}

export async function signInWithGoogle(formData: FormData) {
  if (!isSupabaseConfigured()) redirect("/sign-in?error=config");
  const next = safeNext(formData.get("next") as string | null);
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${await siteOrigin()}/auth/callback?next=${encodeURIComponent(next)}` },
  });
  if (error || !data.url) redirect("/sign-in?error=google");
  redirect(data.url);
}

export async function signOut() {
  if (!isSupabaseConfigured()) redirect("/");
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
