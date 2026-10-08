-- Stripe webhook idempotency: each event is processed once even though
-- Stripe retries deliveries. Written only by the webhook (service role).

create table public.stripe_events (
  id text primary key,
  type text not null,
  received_at timestamptz not null default now()
);

alter table public.stripe_events enable row level security;
-- No policies: anon and authenticated users can't read or write it.
revoke all on public.stripe_events from anon, authenticated;
