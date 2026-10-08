"use client";

import { useSearchParams } from "next/navigation";
import { CircleCheck, Info } from "lucide-react";

/** Shows the result of a Stripe Checkout redirect (?checkout=success|cancelled). */
export function CheckoutNotice() {
  const status = useSearchParams().get("checkout");
  if (status !== "success" && status !== "cancelled") return null;

  const success = status === "success";
  const Icon = success ? CircleCheck : Info;
  return (
    <div
      role="status"
      className={
        success
          ? "mb-8 flex items-center gap-3 rounded-2xl border border-lime/30 bg-lime/[0.06] p-4 text-sm"
          : "mb-8 flex items-center gap-3 rounded-2xl border border-border bg-card p-4 text-sm"
      }
    >
      <Icon className={success ? "size-4 text-lime" : "size-4 text-muted-foreground"} aria-hidden="true" />
      {success
        ? "Thanks for upgrading. Your new credits appear as soon as Stripe confirms the payment, usually within a few seconds."
        : "Checkout was cancelled. You haven't been charged."}
    </div>
  );
}
