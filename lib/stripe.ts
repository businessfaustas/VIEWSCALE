import "server-only";

import Stripe from "stripe";

import type { Plan } from "@/lib/database.types";
import { serverEnv } from "@/lib/env";
import { PLANS, isPaidPlan } from "@/lib/pricing";

let client: Stripe | null = null;

/** Stripe client (test mode keys in development). Throws if STRIPE_SECRET_KEY is unset. */
export function getStripe() {
  client ??= new Stripe(serverEnv.stripeSecretKey);
  return client;
}

export function isStripeConfigured() {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

/** The Stripe Price ID for a paid plan, from its env var. */
export function priceIdFor(plan: Plan) {
  const env = PLANS[plan].stripePriceEnv;
  return env ? process.env[env] || null : null;
}

/** Maps a Stripe Price ID back to our plan. */
export function planForPrice(priceId: string | null | undefined): "creator" | "pro" | null {
  if (!priceId) return null;
  for (const plan of ["creator", "pro"] as const) {
    if (priceIdFor(plan) === priceId) return plan;
  }
  return null;
}

export { isPaidPlan };
