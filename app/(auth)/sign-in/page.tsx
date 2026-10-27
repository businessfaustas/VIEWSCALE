import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";

import { AuthCardSkeleton, AuthShell } from "@/components/auth/auth-shell";
import { AuthForm } from "@/components/auth/auth-form";
import { SetupNotice } from "@/components/site/setup-notice";
import { isSupabaseConfigured } from "@/lib/env";

export const metadata: Metadata = { title: "Sign in" };

export default function SignInPage() {
  return (
    <AuthShell
      notice={isSupabaseConfigured() ? null : <SetupNotice kind="supabase" />}
      title="Welcome back"
      subtitle="Sign in to see your diagnostics."
      footer={
        <>
          New to ViewScale?{" "}
          <Link href="/sign-up" className="font-medium text-lime hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <Suspense fallback={<AuthCardSkeleton />}>
        <AuthForm mode="sign-in" />
      </Suspense>
    </AuthShell>
  );
}
