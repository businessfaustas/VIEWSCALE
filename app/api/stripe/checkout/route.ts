import { NextResponse } from "next/server";
import { z } from "zod";

import { jsonError, readJson } from "@/lib/api";
import { getUser } from "@/lib/auth";
import { isPaidPlan } from "@/lib/pricing";
import { getStripe, isStripeConfigured, priceIdFor } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

const bodySchema = z.object({ plan: z.enum(["creator", "pro"]) });

/** Starts a Stripe Checkout subscription for the signed-in user. */
export async function POST(request: Request) {
  const user = await getUser();
  if (!user) return jsonError("Sign in to upgrade.", 401);

  const parsed = bodySchema.safeParse(await readJson(request));
  if (!parsed.success) return jsonError("Pick a plan.", 400);
  const { plan } = parsed.data;

  if (!isStripeConfigured()) {
    return jsonError("Payments aren't set up yet. Add the Stripe test keys to .env.local.", 503);
  }
  const price = priceIdFor(plan);
  if (!price) return jsonError(`Missing the Stripe Price ID for the ${plan} plan.`, 503);

  const origin = new URL(request.url).origin;
  const stripe = getStripe();
  const admin = createAdminClient();

  const { data: profile } = await admin
    .from("profiles")
    .select("name, plan, stripe_customer_id")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile) return jsonError("Your profile is missing.", 409);

  try {
    // Already subscribed: switching plans happens in the billing portal so
    // there's never a second subscription.
    if (isPaidPlan(profile.plan) && profile.stripe_customer_id) {
      const portal = await stripe.billingPortal.sessions.create({
        customer: profile.stripe_customer_id,
        return_url: `${origin}/pricing`,
      });
      return NextResponse.json({ url: portal.url });
    }

    let customerId = profile.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email ?? undefined,
        name: profile.name ?? undefined,
        metadata: { user_id: user.id },
      });
      customerId = customer.id;
      await admin.from("profiles").update({ stripe_customer_id: customerId }).eq("id", user.id);
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      client_reference_id: user.id,
      line_items: [{ price, quantity: 1 }],
      subscription_data: { metadata: { user_id: user.id, plan } },
      metadata: { user_id: user.id, plan },
      allow_promotion_codes: true,
      success_url: `${origin}/dashboard?checkout=success`,
      cancel_url: `${origin}/pricing?checkout=cancelled`,
    });
    if (!session.url) throw new Error("Checkout session has no URL");
    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("[stripe/checkout]", err);
    return jsonError("Couldn't start checkout. Try again in a moment.", 502);
  }
}
