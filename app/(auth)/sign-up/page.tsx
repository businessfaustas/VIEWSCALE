import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";

import { AuthCardSkeleton, AuthShell } from "@/components/auth/auth-shell";
import { AuthForm } from "@/components/auth/auth-form";

export const metadata: Metadata = { title: "Create your account" };

export default function SignUpPage() {
  return (
    <AuthShell
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
