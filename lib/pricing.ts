import type { Plan } from "@/lib/database.types";

/**
 * Pricing shown on /pricing and used by the Stripe webhook.
 *
 * Edit prices, credit allowances and copy here. The amount actually charged
 * comes from the Stripe Price each paid plan points at (STRIPE_PRICE_CREATOR /
 * STRIPE_PRICE_PRO), so keep `priceMonthly` in sync with those Prices.
 */
export type PlanConfig = {
  id: Plan;
  name: string;
  /** USD per month, display only. 0 for the free tier. */
  priceMonthly: number;
  /** Free: one-time credits on sign-up. Paid: credits each billing month. */
  credits: number;
  tagline: string;
  features: string[];
  highlighted?: boolean;
  /** Env var holding the Stripe Price ID (paid plans only). */
  stripePriceEnv?: "STRIPE_PRICE_CREATOR" | "STRIPE_PRICE_PRO";
};

export const PLANS: Record<Plan, PlanConfig> = {
  free: {
    id: "free",
    name: "Free",
    priceMonthly: 0,
    credits: 3,
    tagline: "See what's holding your videos back.",
    features: [
      "3 video analyses",
      "Full 12-area diagnosis",
      "Timestamped problems and exact fixes",
      "Hook rewrites",
      "PDF export and share links",
    ],
  },
  creator: {
    id: "creator",
    name: "Creator",
    priceMonthly: 19,
    credits: 30,
    tagline: "For creators posting every week.",
    features: [
      "30 analyses every month",
      "Everything in Free",
      "Compare videos side by side",
      "Insights across all your analyses",
    ],
    highlighted: true,
    stripePriceEnv: "STRIPE_PRICE_CREATOR",
  },
  pro: {
    id: "pro",
    name: "Pro",
    priceMonthly: 49,
    credits: 100,
    tagline: "For daily posters and small teams.",
    features: ["100 analyses every month", "Everything in Creator"],
    stripePriceEnv: "STRIPE_PRICE_PRO",
  },
};

export const PLAN_ORDER: Plan[] = ["free", "creator", "pro"];

export function isPaidPlan(plan: string): plan is "creator" | "pro" {
  return plan === "creator" || plan === "pro";
}
