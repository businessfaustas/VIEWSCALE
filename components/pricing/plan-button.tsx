"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { Plan } from "@/lib/database.types";

type Props = {
  plan: Plan;
  planName: string;
  /** null when signed out. */
  currentPlan: Plan | null;
  highlighted?: boolean;
};

export function PlanButton({ plan, planName, currentPlan, highlighted }: Props) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const variant = highlighted ? "default" : "secondary";

  async function go(endpoint: string, body?: unknown) {
    setPending(true);
    setError(null);
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
      if (!res.ok || !data.url) throw new Error(data.error ?? "Something went wrong.");
      window.location.assign(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setPending(false);
    }
  }

  let button: React.ReactNode;
  if (currentPlan === null) {
    button = (
      <Button asChild variant={variant} className="w-full">
        <Link href={plan === "free" ? "/sign-up" : "/sign-up?next=/pricing"}>
          {plan === "free" ? "Start free" : `Get ${planName}`}
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </Button>
    );
  } else if (plan === currentPlan && plan === "free") {
    button = (
      <Button variant="outline" className="w-full" disabled>
        Current plan
      </Button>
    );
  } else if (plan === currentPlan || (plan === "free" && currentPlan !== "free")) {
    button = (
      <Button variant="secondary" className="w-full" disabled={pending} onClick={() => go("/api/stripe/portal")}>
        {pending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
        {plan === currentPlan ? "Manage billing" : "Change plan"}
      </Button>
    );
  } else {
    button = (
      <Button variant={variant} className="w-full" disabled={pending} onClick={() => go("/api/stripe/checkout", { plan })}>
        {pending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
        {currentPlan === "free" ? `Upgrade to ${planName}` : `Switch to ${planName}`}
        {!pending && <ArrowRight className="size-4" aria-hidden="true" />}
      </Button>
    );
  }

  return (
    <div className="space-y-2">
      {button}
      {error && (
        <p role="alert" className="text-center text-xs text-[#fca5a5]">
          {error}
        </p>
      )}
    </div>
  );
}
