import { NextResponse } from "next/server";
import type Stripe from "stripe";

import { jsonError } from "@/lib/api";
import { PLANS } from "@/lib/pricing";
import { getStripe, planForPrice } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

type Admin = ReturnType<typeof createAdminClient>;

/**
 * Stripe webhook. Configure the endpoint (or `stripe listen --forward-to
 * localhost:3000/api/stripe/webhook`) with these events:
 * checkout.session.completed, invoice.paid, customer.subscription.updated,
 * customer.subscription.deleted.
 */
export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret || !process.env.STRIPE_SECRET_KEY) return jsonError("Stripe isn't configured.", 503);

  const signature = request.headers.get("stripe-signature");
  if (!signature) return jsonError("Missing signature.", 400);

  const stripe = getStripe();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(await request.text(), signature, secret);
  } catch {
    return jsonError("Invalid signature.", 400);
  }

  const admin = createAdminClient();

  // Stripe retries deliveries; handle each event once.
  const { error: seenError } = await admin.from("stripe_events").insert({ id: event.id, type: event.type });
  if (seenError) {
    if (seenError.code === "23505") return NextResponse.json({ received: true, duplicate: true });
    return jsonError("Couldn't record the event.", 500);
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await linkCustomer(admin, event.data.object);
        break;
      case "invoice.paid":
        await grantCredits(admin, stripe, event.data.object);
        break;
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        await syncPlan(admin, event.data.object, event.type === "customer.subscription.deleted");
        break;
    }
  } catch (err) {
    console.error("[stripe/webhook]", event.type, event.id, err);
    // Forget the event so Stripe's retry gets processed.
    await admin.from("stripe_events").delete().eq("id", event.id);
    return jsonError("Webhook handler failed.", 500);
  }

  return NextResponse.json({ received: true });
}

const idOf = (value: string | { id: string } | null | undefined) =>
  typeof value === "string" ? value : (value?.id ?? null);

async function userForCustomer(admin: Admin, customerId: string | null) {
  if (!customerId) return null;
  const { data } = await admin.from("profiles").select("id").eq("stripe_customer_id", customerId).maybeSingle();
  return data?.id ?? null;
}

/** Remembers which Stripe customer belongs to which user. */
async function linkCustomer(admin: Admin, session: Stripe.Checkout.Session) {
  const userId = session.client_reference_id ?? session.metadata?.user_id;
  const customerId = idOf(session.customer);
  if (!userId || !customerId) return;
  await admin
    .from("profiles")
    .update({ stripe_customer_id: customerId })
    .eq("id", userId)
    .is("stripe_customer_id", null);
}

/** Each paid invoice sets the plan and resets the month's credits. */
async function grantCredits(admin: Admin, stripe: Stripe, invoice: Stripe.Invoice) {
  const subscriptionId = idOf(invoice.parent?.subscription_details?.subscription);
  if (!subscriptionId) return; // not a subscription invoice

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const plan = planForPrice(subscription.items.data[0]?.price.id);
  if (!plan) throw new Error(`Unknown price on subscription ${subscriptionId}`);

  const userId =
    subscription.metadata?.user_id || (await userForCustomer(admin, idOf(subscription.customer)));
  if (!userId) throw new Error(`No user for subscription ${subscriptionId}`);

  const { error } = await admin.rpc("set_plan_credits", {
    p_user_id: userId,
    p_plan: plan,
    p_credits: PLANS[plan].credits,
  });
  if (error) throw new Error(error.message);
}

/** Keeps profiles.plan in step with the subscription (upgrades, downgrades, cancellation). */
async function syncPlan(admin: Admin, subscription: Stripe.Subscription, deleted: boolean) {
  const userId =
    subscription.metadata?.user_id || (await userForCustomer(admin, idOf(subscription.customer)));
  if (!userId) return;

  const ended = deleted || ["canceled", "unpaid", "incomplete_expired"].includes(subscription.status);
  // Credits stay as they are; the next paid invoice sets the new allowance.
  const plan = ended ? "free" : planForPrice(subscription.items.data[0]?.price.id);
  if (!plan) return;
  const { error } = await admin.from("profiles").update({ plan }).eq("id", userId);
  if (error) throw new Error(error.message);
}
