"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { useSearchParams } from "next/navigation";
import { ArrowRight, CircleAlert, Loader2, MailCheck } from "lucide-react";

import {
  signInWithGoogle,
  signInWithPassword,
  signUp,
  type AuthState,
} from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const CALLBACK_ERRORS: Record<string, string> = {
  google: "Google sign-in didn't start. Try again, or use email instead.",
  callback: "That sign-in link is invalid or has expired. Try signing in again.",
  config: "Sign-in isn't connected yet. Add the Supabase keys to the environment variables, then redeploy.",
};

export function AuthForm({ mode }: { mode: "sign-in" | "sign-up" }) {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/dashboard";
  const callbackError = CALLBACK_ERRORS[searchParams.get("error") ?? ""];

  const [state, formAction] = useActionState<AuthState, FormData>(
    mode === "sign-in" ? signInWithPassword : signUp,
    {},
  );

  if (state.message) {
    return (
      <div className="flex flex-col items-center gap-3 py-4 text-center" role="status">
        <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-icon-tile text-lime">
          <MailCheck className="size-6" aria-hidden="true" />
        </span>
        <p className="font-semibold">Check your inbox</p>
        <p className="text-sm text-muted-foreground">{state.message}</p>
      </div>
    );
  }

  const error = state.error ?? callbackError;

  return (
    <div className="space-y-5">
      <form action={signInWithGoogle}>
        <input type="hidden" name="next" value={next} />
        <GoogleButton />
      </form>

      <div className="flex items-center gap-3" aria-hidden="true">
        <span className="h-px flex-1 bg-border" />
        <span className="label-mono text-[10px] text-muted-foreground">or with email</span>
        <span className="h-px flex-1 bg-border" />
      </div>

      <form action={formAction} className="space-y-4" noValidate>
        <input type="hidden" name="next" value={next} />
        {mode === "sign-up" && (
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              autoComplete="name"
              required
              defaultValue={state.name}
              placeholder="Maya"
            />
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            defaultValue={state.email}
            placeholder="you@example.com"
            aria-invalid={Boolean(state.error) || undefined}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
            required
            minLength={mode === "sign-up" ? 8 : undefined}
            placeholder={mode === "sign-up" ? "At least 8 characters" : "••••••••"}
            aria-invalid={Boolean(state.error) || undefined}
          />
        </div>

        {error && (
          <p
            role="alert"
            className="flex items-start gap-2 rounded-xl border border-danger/30 bg-danger/[0.08] px-3 py-2.5 text-sm text-[#fca5a5]"
          >
            <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            {error}
          </p>
        )}

        <SubmitButton label={mode === "sign-in" ? "Sign in" : "Create account"} />
      </form>
    </div>
  );
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
      {label}
      {!pending && <ArrowRight className="size-4" aria-hidden="true" />}
    </Button>
  );
}

function GoogleButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="outline" className="w-full" disabled={pending}>
      {pending ? (
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
      ) : (
        <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.1A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.44.34-2.1V7.06H2.18A11 11 0 0 0 1 12c0 1.77.43 3.45 1.18 4.94l3.66-2.84Z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15A10.97 10.97 0 0 0 12 1 11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38Z"
          />
        </svg>
      )}
      Continue with Google
    </Button>
  );
}
