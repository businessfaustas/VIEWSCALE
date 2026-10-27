import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";

import { AuthCardSkeleton, AuthShell } from "@/components/auth/auth-shell";
import { AuthForm } from "@/components/auth/auth-form";
import { SetupNotice } from "@/components/site/setup-notice";
import { isSupabaseConfigured } from "@/lib/env";

export const metadata: Metadata = { title: "Create your account" };

export default function SignUpPage() {
  return (
    <AuthShell
      notice={isSupabaseConfigured() ? null : <SetupNotice kind="supabase" />}
      title="Create your account"
      subtitle="Your first 3 analyses are free. No card needed."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/sign-in" className="font-medium text-lime hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <Suspense fallback={<AuthCardSkeleton />}>
        <AuthForm mode="sign-up" />
      </Suspense>
    </AuthShell>
  );
}
