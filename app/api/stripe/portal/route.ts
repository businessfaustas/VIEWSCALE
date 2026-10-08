import { NextResponse } from "next/server";

import { jsonError } from "@/lib/api";
import { getUser } from "@/lib/auth";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

/** Opens the Stripe billing portal (change plan, update card, cancel). */
export async function POST(request: Request) {
  const user = await getUser();
  if (!user) return jsonError("Sign in to manage billing.", 401);
  if (!isStripeConfigured()) return jsonError("Payments aren't set up yet.", 503);

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile?.stripe_customer_id) return jsonError("You don't have a subscription yet.", 400);

  try {
    const portal = await getStripe().billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${new URL(request.url).origin}/pricing`,
    });
    return NextResponse.json({ url: portal.url });
  } catch (err) {
    console.error("[stripe/portal]", err);
    return jsonError("Couldn't open billing. Try again in a moment.", 502);
  }
}
