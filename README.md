# ViewScale

ViewScale analyzes short-form videos (TikTok, Instagram Reels, YouTube Shorts) and explains what limits their performance, with timestamped problems and exact fixes.

## Stack

Next.js 16 (App Router, TypeScript, Cache Components) · Tailwind CSS v4 · shadcn/ui (Radix) · lucide-react · Framer Motion · Recharts · Supabase (auth, Postgres, Storage) · Anthropic API (analysis) · OpenAI Whisper (transcription) · Stripe (subscriptions, test mode) · Zod

## Setup

```bash
npm install
cp .env.example .env.local
npm run dev            # http://localhost:3000
```

Every variable is listed in `.env.example`. Secrets are only read on the server; nothing
except `NEXT_PUBLIC_*` reaches the browser.

### 1. Supabase

**Hosted project**

1. Create a project at supabase.com.
2. Apply the migrations: `npx supabase link --project-ref <ref>` then `npx supabase db push`
   (or paste each file in `supabase/migrations/` into the SQL editor, in order).
3. Put the project URL, anon key and service role key in `.env.local`.
4. Auth → URL Configuration: set the Site URL to your app URL and add
   `<your-url>/auth/callback` to the redirect URLs.
5. Google sign-in: Auth → Providers → Google. Create an OAuth client in Google Cloud with
   the redirect URI Supabase shows you, then paste the client ID and secret.
6. Uploads up to 200 MB need Supabase Pro (the Free plan caps files at 50 MB). Raise the
   global limit under Storage → Settings. The `videos` bucket itself allows 200 MB.

**Local (Docker)**

```bash
npx supabase start     # applies supabase/migrations and prints local keys
```

Put the printed API URL, anon key and service role key in `.env.local`. Email
confirmation is off locally, so sign-up signs you straight in.

### 2. Anthropic and OpenAI

- `ANTHROPIC_API_KEY`: the analysis model defaults to `claude-sonnet-5-5` (override with
  `ANTHROPIC_MODEL`).
- `OPENAI_API_KEY`: used for Whisper transcription. Without it, analyses still run from
  frames only, and the report lists the missing transcript.

### 3. Stripe (test mode)

1. In the Stripe dashboard (test mode), create two products with recurring monthly prices,
   Creator and Pro, matching `lib/pricing.ts`. Put the price IDs in
   `STRIPE_PRICE_CREATOR` and `STRIPE_PRICE_PRO`.
2. Put the secret and publishable keys in `.env.local`.
3. Turn on the customer portal (Settings → Billing → Customer portal) and allow switching
   between the two prices and cancelling.
4. Forward webhooks locally and copy the signing secret into `STRIPE_WEBHOOK_SECRET`:
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook \
     --events checkout.session.completed,invoice.paid,customer.subscription.updated,customer.subscription.deleted
   ```
   In production, add the same endpoint and events in the dashboard.
5. Pay with test card `4242 4242 4242 4242`.

### 4. The analysis prompt

**`lib/prompts/viewscale.ts` holds an interim prompt.** Paste the ViewScale system prompt
into `VIEWSCALE_SYSTEM_PROMPT`, without its "Output format" section
(`OUTPUT_FORMAT_INSTRUCTIONS` replaces it), then set `PROMPT_IS_PLACEHOLDER` to `false`.
Until then, the server logs a warning on the first analysis.

## Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` / `npm start` | Production build / server |
| `npm run typecheck` | Generates route types, then runs `tsc` |
| `npm run lint` | ESLint |

## How it works

### Upload and analysis pipeline

All video processing happens in the browser, so the server needs no ffmpeg.

1. `POST /api/analyses` checks credits, caps uploads in progress at 3, creates the row,
   and returns the Storage paths.
2. The browser uploads the video straight to Supabase Storage, with progress.
3. In parallel it extracts frames with a hidden `<video>` + `<canvas>`
   (`lib/video/frames.ts`). It samples every 0.5s for the first 3s, then every 1.5s, at
   most 40 frames, as 512px-wide JPEGs. The first and last frames are always included. On
   long videos the spacing after 3s widens so the whole video fits in 40 frames.
4. It decodes the audio to 16 kHz mono WAV (`lib/video/audio.ts`) and uploads it.
5. `POST /api/transcribe` sends the WAV to Whisper and stores timestamped segments. No
   audio, silent audio or a Whisper failure is recorded, and the run continues from
   frames only.
6. `POST /api/analyze` takes one credit atomically (`consume_credit`). It then sends the
   labeled frames (base64), transcript, platform, context and any real performance data
   to Claude and saves the result. Any failure refunds the credit (`refund_credit`) and
   marks the analysis failed. The upload page offers "Retry analysis".

Progress is shown as Uploading → Extracting frames → Transcribing → Analyzing → Done, and
every failure is shown on screen.

### Claude call (`lib/analysis/claude.ts`)

- Streamed, adaptive thinking, `effort: "high"`, system prompt prompt-cached.
- **Structured output:** a JSON schema (`lib/analysis/output-schema.ts`) makes the API
  return JSON of the right shape. Zod (`lib/analysis/schema.ts`) then checks what JSON
  Schema can't: exactly 12 areas, exactly 3 top fixes, and the score range. If
  validation fails, the request is retried once with the errors included.
- **Refusal fallback:** `fallbacks: "default"` (beta `server-side-fallback-2026-07-01`)
  lets the API retry a policy decline on a fallback model, for the categories that
  support it. Claude API only.
- **Normalizing:** areas are put in canonical order, timestamps are clamped to the video,
  and known missing inputs (transcript, caption, performance data) are always listed.

### Report (`/analysis/[id]`)

- Embedded player; every timestamp chip seeks it.
- Score ring and final verdict.
- "Estimated drop-off risk" chart, marked as an estimate. Real performance data is shown
  separately and labeled as real.
- Summary cards, top 3 fixes, hook alternatives with copy buttons, 12 area accordions,
  what to keep, and missing inputs.
- **Export as PDF:** the print dialog, with every section expanded and the dark theme
  kept.
- **Share link:** a random 32-character slug. `/share/<slug>` is a public, read-only view
  that leaves out the caption and performance data. "Stop sharing" turns the link off.

ViewScale never shows predicted view counts.

### Data model (`supabase/migrations`)

- `profiles`: created by a trigger on sign-up, with `credits` (default 3), `plan` and
  `stripe_customer_id`.
- `analyses`: inputs, frames, transcript, result JSON, score, status and share slug.
- `stripe_events`: processed webhook IDs, so a retried delivery is handled once.
- RLS is on for every table: users read and write only their own rows. Column privileges
  stop users from editing credits, plan, status or results; server routes write those
  with the service role.
- Credits change only through `consume_credit`, `refund_credit` and `set_plan_credits`.
  They are atomic and only the service role can call them.
- Shared reports are read through `get_shared_analysis(slug)`, which returns one analysis
  by its exact slug. There is no way to list shared analyses.
- Storage: a private `videos` bucket with one folder per user
  (`{user_id}/{analysis_id}/...`), enforced by policies.

### Billing

- Each paid `invoice.paid` sets the plan and resets the month's credits to the plan's
  allowance from `lib/pricing.ts`.
- Plan changes and cancellation come from `customer.subscription.updated` / `.deleted`.
- Subscribed users who pick another plan are sent to the billing portal, so a customer
  never has two subscriptions.

**Edit prices and allowances in `lib/pricing.ts`.**

## Design system

Tokens live in `app/globals.css` (`:root` + `@theme`). The app is dark-only.

| Token | Value | Tailwind |
| --- | --- | --- |
| Background | `#05070D` | `bg-background` |
| Card surface | `#0A0E16`, 1px `#1A2030` border, 16px radius | `surface-card` |
| Primary accent | `#B8FF3C` | `bg-primary`, `text-lime` |
| Headline gradient | `#C6FF3D` → `#4ADE3A` | `text-gradient-lime` |
| Heading / body text | `#F2F4F8` / `#8A93A6` | `text-foreground` / `text-muted-foreground` |
| Status | red `#EF4444`, orange `#F59E0B`, lime | `text-danger`, `text-warning`, `text-lime` |
| Icon tile | `#1A2A10`, 56px | `<IconTile />` |
| Lime glow | `0 0 40px rgba(184,255,60,0.35)` | `shadow-glow` |
| Mono section label | JetBrains Mono, uppercase, tracked | `label-mono` |

Fonts: Inter (`font-sans`) and JetBrains Mono (`font-mono`) via `next/font`.

## Project layout

```
app/                    landing, pricing, share/[slug], auth callbacks, api/*
app/(auth)/             sign-in, sign-up, auth server actions
app/(app)/              dashboard, upload, analysis/[id], compare (signed in)
proxy.ts                session refresh + auth redirects (Next 16's "middleware")
supabase/               config.toml + SQL migrations
components/             brand, site, landing, charts, app, auth, dashboard, upload,
                        report, compare, pricing, ui (shadcn/ui)
lib/supabase/           browser, server, admin (service role) and proxy clients
lib/analysis/           Zod schema, JSON schema, Claude call, stats, report mapping
lib/video/              frame extraction, audio extraction, Storage uploads
lib/prompts/            the ViewScale system prompt
lib/pricing.ts          plans, prices, credit allowances
```

## Notes

- shadcn/ui components are written by hand in `components/ui/` to match the `new-york`
  style and `components.json`, so `npx shadcn add <component>` works as usual.
- The landing page's live analysis preview uses hardcoded demo data.
- Frame extraction runs in the browser, so the browser must be able to decode the video.
  Chrome, Safari and Edge handle H.264 MP4 and most MOV files. HEVC MOV files may not play
  in every browser, and the app asks for an H.264 MP4 when that happens.
