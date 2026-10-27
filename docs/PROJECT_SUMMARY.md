# ViewScale: Project Summary and Handoff

This document describes the whole ViewScale codebase: what it is for, how it is built, every route and module, the database, the AI pipeline, the design system, the decisions made along the way, what has been tested, and what is still open. It is written so another developer or AI assistant can pick the project up without prior context.

- Repository: `businessfaustas/VIEWSCALE`
- Branch: `claude/gallant-darwin-mpwvog` (the repository's default and only branch)
- State: all five planned build steps are complete, committed and pushed. Production build, `tsc` and ESLint pass.
- Read alongside: `README.md` (setup guide), `AGENTS.md` (Next.js 16 rule for coding agents), `.env.example` (every environment variable).

---

## 1. What ViewScale is

ViewScale is a web app for short-form video creators (TikTok, Instagram Reels, YouTube Shorts). A creator uploads a video. The app extracts frames and a transcript, sends them to Claude, and returns a report that explains what limits the video's performance. The report has timestamped problems, why each one matters, the exact fix, and an example of the fix.

Core user journey:

1. Visitor lands on `/` (marketing page) and signs up (email/password or Google).
2. New users get 3 free credits. One analysis costs one credit.
3. On `/upload` they drop a video (MP4/MOV, max 3 minutes, max 200 MB), pick the platform, and optionally add caption, niche, goal and real performance numbers.
4. The browser uploads the video, extracts frames and audio, the server transcribes the audio with Whisper, and Claude analyzes everything.
5. They land on `/analysis/[id]`, a full report with a video player, score, drop-off chart, fixes, hook rewrites and 12 rated areas. They can export it to PDF or share a public read-only link.
6. `/dashboard` summarizes all their analyses. `/compare` puts two analyses side by side. `/pricing` sells monthly credit plans through Stripe.

---

## 2. The original brief (condensed)

These requirements came from the product owner. Keep them intact when changing the app.

### Stack (as requested)

- Next.js 14+ (App Router, TypeScript), Tailwind CSS, shadcn/ui, lucide-react, Framer Motion
- Supabase: auth (email + Google), Postgres, Storage (video uploads)
- Anthropic API for analysis, model `claude-sonnet-5-5`, server-side only, key never exposed to the client
- OpenAI Whisper API for transcription (server-side)
- Stripe for credits/subscriptions (scaffold, test mode)
- Recharts for charts, Zod for validation
- All secrets in `.env.local`; `.env.example` lists every variable

### Hard rules

- Never display a predicted view count anywhere in the app.
- No fake testimonials or user counts on the landing page.
- Handle errors visibly:
  - Failed upload: shown on screen.
  - Failed transcription: continue with frames only and report it in `missingInputs`.
  - Failed analysis: refund the credit.
- Loading states use skeletons in the dark card style, not spinners on blank screens.
- Ask the owner before adding any dependency not listed in the stack. (The shadcn/ui building blocks were flagged and accepted.)
- Commit after each build step.

### Build order (all done)

1. Scaffold, design tokens, logo, landing page
2. Auth, database schema, dashboard shell
3. Upload, frame extraction, transcription
4. Claude analysis route and report page
5. Compare, pricing, Stripe

### Analysis result schema (required by the brief)

```json
{
  "overallScore": "number (0-100)",
  "areas": [
    {
      "id": "hook | retention | structure | pacing | clarity | engagement | triggers | visual | audio | rewatch | cta | platformFit",
      "title": "string",
      "rating": "strong | ok | weak | not_assessed",
      "summary": "string",
      "issues": [
        { "problem": "string", "evidence": "string", "timestamp": "number | null", "whyItMatters": "string", "fix": "string", "example": "string" }
      ]
    }
  ],
  "dropOffRisks": [ { "timestamp": "number", "severity": "low | medium | high", "reason": "string" } ],
  "summary": {
    "biggestStrength": "string",
    "biggestProblem": "string",
    "biggestOpportunity": "string",
    "topFixes": ["string", "string", "string"],
    "hookAlternatives": [ { "angle": "string", "hook": "string" } ],
    "whatToKeep": ["string"],
    "finalVerdict": "string"
  },
  "missingInputs": ["string"]
}
```

---

## 3. Current status

### Built and working

- Marketing landing page with animations, responsive (mobile, tablet, desktop)
- Email/password and Google sign-in, sign-up, sign-out, protected routes
- Supabase schema with RLS, column privileges, atomic credit functions, private storage
- Dashboard with tool cards, stats, recent analyses and insights
- Upload flow with in-browser frame extraction, audio extraction, direct-to-Storage uploads with progress, Whisper transcription
- Claude analysis with structured output, Zod validation, one retry, credit charge and refund
- Report page with seekable timestamps, drop-off chart, PDF export, share links
- Compare page, pricing page, Stripe checkout, billing portal and webhook

### Open items (see section 16 for the full list)

- **The real system prompt is missing.** `lib/prompts/viewscale.ts` holds an interim prompt written by the AI that built the app. The owner must paste the real ViewScale prompt in and set `PROMPT_IS_PLACEHOLDER = false`.
- **The 5 design screenshots never arrived.** The UI was built from the owner's written design spec, so it may differ from the intended screens.
- Four dashboard tools are "Coming soon" placeholders: Creator Identity, Analytics Translator, Repurpose Engine, Growth Plan.
- No live deployment exists yet. The recommended path is Vercel (see README).

---

## 4. Tech stack (installed versions)

| Package | Version | Use |
| --- | --- | --- |
| next | 16.4.3 | App Router, Turbopack, Cache Components, Partial Prefetching (upgraded from 16.4.0 for a security fix) |
| react / react-dom | 19.3.0 | |
| tailwindcss | 4.3.3 | CSS-first config in `app/globals.css` |
| radix-ui | 1.7.0 | Unified Radix package used by the shadcn components |
| class-variance-authority, clsx, tailwind-merge, tw-animate-css | latest | shadcn/ui helpers |
| framer-motion | 14.0.0 | Landing animations, mobile menu, chart markers |
| lucide-react | 1.53.0 | Icons |
| recharts | 3.10.1 | Drop-off risk chart |
| @supabase/supabase-js | 2.117.3 | Database, Storage, Auth |
| @supabase/ssr | 0.12.7 | Cookie-based sessions for Next.js |
| zod | 4.6.5 | Input and result validation |
| @anthropic-ai/sdk | 0.132.1 | Claude analysis |
| openai | 7.30.1 | Whisper transcription |
| stripe | 23.0.0 | Billing (API version `2026-09-30.endive`) |

Scripts: `npm run dev`, `npm run build`, `npm start`, `npm run lint`, `npm run typecheck` (runs `next typegen` then `tsc --noEmit`; typegen is needed for the global `PageProps` / `LayoutProps` types).

### shadcn/ui note

The shadcn registry host was blocked in the build environment, so components in `components/ui/` were written by hand in the `new-york` style. `components.json` is set up, so `npx shadcn add <component>` works on a normal machine.

---

## 5. Next.js 16 specifics you must know

This project uses Next.js 16. Several conventions differ from older versions. `AGENTS.md` instructs coding agents to read the bundled docs in `node_modules/next/dist/docs/` before writing Next.js code.

- **`proxy.ts`, not `middleware.ts`.** Next 16 renamed middleware to proxy. `proxy.ts` at the root refreshes the Supabase session and handles auth redirects.
- **Cache Components are on** (`cacheComponents: true`, `partialPrefetching: true` in `next.config.ts`). Consequences:
  - Anything that reads request data (`cookies()`, `headers()`, `params`, `searchParams`, the Supabase session) must render inside a `<Suspense>` boundary, or the build fails. Every authenticated page follows this pattern: static header outside, data inside `<Suspense fallback={<Skeleton…/>}>`.
  - `usePathname()` on dynamic routes must also be inside `<Suspense>`. The navbar wraps its active-link logic this way (`ActiveNavLinks` inside `Suspense`, `NavLinks` as fallback).
  - `lib/supabase/server.ts` calls `await connection()` before `cookies()`. Supabase reads the clock while loading a session, and without this Next reports "used Date.now() while prerendering".
  - Route segment options `dynamic` and `revalidate` are removed in this mode; `maxDuration` still works (used on API routes).
- `params` and `searchParams` are Promises. Pages use the generated global types `PageProps<"/analysis/[id]">`, `PageProps<"/compare">`, `PageProps<"/share/[slug]">`.
- `server-only` is resolved internally by Next; `types/server-only.d.ts` gives TypeScript the module declaration.
- React 19 resets uncontrolled form fields after a form action. The auth forms echo `email` and `name` back in the action state and use them as `defaultValue`. The upload form uses `onSubmit` with `preventDefault` and stays mounted (hidden) while running, so "Try again" keeps what was typed.

---

## 6. Project structure

```
app/
  layout.tsx                 Root layout: Inter + JetBrains Mono, MotionProvider, metadata, dark theme color
  page.tsx                   Landing page (static)
  not-found.tsx              Styled 404
  icon.svg                   Favicon (logo mark)
  globals.css                Design tokens, Tailwind theme, utilities, print styles
  pricing/page.tsx           Pricing (config-driven, plan buttons aware of the signed-in plan)
  share/[slug]/page.tsx      Public read-only report
  auth/callback/route.ts     OAuth / email PKCE code exchange
  auth/confirm/route.ts      Email token_hash verification
  (auth)/actions.ts          Server actions: signInWithPassword, signUp, signInWithGoogle, signOut
  (auth)/sign-in/page.tsx
  (auth)/sign-up/page.tsx
  (app)/layout.tsx           Signed-in shell: navbar with credits pill + account menu, footer
  (app)/dashboard/page.tsx
  (app)/upload/page.tsx
  (app)/analysis/[id]/page.tsx
  (app)/analysis/[id]/actions.ts   Server actions: createShareLink, revokeShareLink
  (app)/compare/page.tsx
  api/analyses/route.ts      POST: create analysis row, return Storage paths
  api/transcribe/route.ts    POST: Whisper transcription
  api/analyze/route.ts       POST: charge credit, run Claude, save result or refund
  api/stripe/checkout/route.ts
  api/stripe/portal/route.ts
  api/stripe/webhook/route.ts
proxy.ts                     Session refresh + auth redirects

components/
  brand/logo.tsx             LogoMark (SVG play triangle with notch) + Logo (mark + "viewscale")
  site/navbar.tsx            Sticky navbar, desktop links, animated mobile menu; slots for signed-in actions
  site/footer.tsx
  site/section-heading.tsx   Mono label + two-line H2 with lime-gradient second line
  motion-provider.tsx        Framer MotionConfig reducedMotion="user"
  landing/                   hero, dashboard-preview, live-analysis, features, how-it-works, final-cta, window-dots
  charts/drop-off-chart.tsx  Recharts drop-off risk chart (landing + report)
  app/                       score-ring, stat-card, icon-tile, user-menu (server), user-menu-dropdown (client)
  auth/                      auth-shell, auth-form
  dashboard/                 tool-grid, dashboard-tabs, analysis-list, insights
  upload/                    upload-flow (the whole client pipeline), dropzone, progress-steps
  report/                    report-view, player (provider, video, timestamp chip), report-actions (PDF, share),
                             rating-chip, copy-button, report-states (processing/failed), report-skeleton
  compare/compare-picker.tsx
  pricing/                   plan-button, checkout-notice
  ui/                        button, input, textarea, label, skeleton, tabs, dropdown-menu (shadcn style)

lib/
  env.ts                     publicEnv / serverEnv getters with clear "missing variable" errors
  utils.ts                   cn, formatTimestamp (m:ss), formatMoment (m:ss.t), scoreTone, formatDate, formatBytes
  auth.ts                    getUser (getClaims), requireUser (redirect), safeNext (open-redirect guard)
  data.ts                    getProfile, getAnalyses (React cache), signPaths (signed Storage URLs)
  api.ts                     jsonError, readJson
  database.types.ts          Hand-written Supabase Database types
  storage.ts                 VIDEO_BUCKET, analysisFolder, videoExtension
  platforms.ts               tiktok/reels/shorts labels
  tools.ts                   The 6 dashboard tools (href null = coming soon)
  drop-off.ts                Risk-curve math for the chart, severity colors, axis ticks
  pricing.ts                 Plans, prices, credit allowances (edit here)
  stripe.ts                  Stripe client, plan <-> price ID mapping
  prompts/viewscale.ts       System prompt (interim) + output-format instructions
  analysis/schema.ts         Zod result schema, AREA_IDS, AREA_LABELS, RATINGS
  analysis/output-schema.ts  JSON Schema sent to the API for structured output
  analysis/inputs.ts         Request schemas, limits, transcript types, goals list
  analysis/claude.ts         Builds the request, calls Claude, validates, retries, normalizes
  analysis/report.ts         Maps a DB row to ReportData (private fields optional)
  analysis/stats.ts          Dashboard stats and per-area breakdown
  supabase/client.ts         Browser client
  supabase/server.ts         Server client (cookies, RLS as the user)
  supabase/admin.ts          Service-role client (bypasses RLS; server only)
  supabase/proxy.ts          updateSession used by proxy.ts
  video/frames.ts            Frame schedule + extraction (hidden video + canvas)
  video/audio.ts             Audio decode to 16 kHz mono WAV
  video/upload.ts            XHR upload to Storage with progress, concurrency pool

supabase/
  config.toml                Local Supabase config (Google provider stub, 200 MiB storage limit)
  migrations/20261008000000_init.sql
  migrations/20261008010000_stripe_events.sql

types/server-only.d.ts
docs/PROJECT_SUMMARY.md      This file
```

---

## 7. Routes

### Pages

| Route | Access | What it shows |
| --- | --- | --- |
| `/` | Public | Landing page |
| `/pricing` | Public | Plans; buttons change when signed in; `?checkout=cancelled` notice |
| `/sign-in`, `/sign-up` | Public (signed-in users are redirected to `/dashboard`) | Auth card: Google button, email form; `?next=` and `?error=google|callback` supported |
| `/dashboard` | Signed in | Tools, stats, recent analyses, insights; `?checkout=success` notice |
| `/upload` | Signed in | Upload form and progress view |
| `/analysis/[id]` | Signed in, owner only (RLS) | Report, or processing / failed state |
| `/compare` | Signed in | `?a=<id>&b=<id>` comparison |
| `/share/[slug]` | Public, `noindex` | Read-only report without private inputs |

Protection is two layers: `proxy.ts` redirects signed-out users from `/dashboard`, `/upload`, `/analysis`, `/compare` to `/sign-in?next=...`, and each page calls `requireUser()` again. If Supabase env vars are missing, the proxy lets requests through so the marketing pages still render.

### API routes (all `POST`, JSON)

| Route | Auth | Purpose |
| --- | --- | --- |
| `/api/analyses` | User | Validate input, check credits (402 `insufficient_credits`), cap 3 unfinished uploads in the last hour (429), insert row, return `{ id, folder, videoPath, thumbnailPath }` |
| `/api/transcribe` | User | Body `{ analysisId, audio: "ok" \| "no_audio" \| "silent" \| "unsupported" }`. Only allowed while status is `uploading` (409 otherwise). Whisper `whisper-1`, `verbose_json`, segment timestamps. Stores transcript, sets status `processing`. Failures return 200 `{ status: "failed" }` so the run continues. `maxDuration` 120 |
| `/api/analyze` | User | Body `{ analysisId, frames: [{ t, path }] }` (1–40). Charges the credit, runs Claude, saves. On failure refunds, marks `failed`, returns 502 `{ code: "analysis_failed", refunded }`. `maxDuration` 300 |
| `/api/stripe/checkout` | User | Body `{ plan: "creator" \| "pro" }` → `{ url }` (Checkout, or the billing portal if already subscribed) |
| `/api/stripe/portal` | User | → `{ url }` billing portal |
| `/api/stripe/webhook` | Stripe signature | Excluded from the proxy matcher; reads the raw body |

### Server actions

- `app/(auth)/actions.ts`: `signInWithPassword`, `signUp` (name stored in user metadata), `signInWithGoogle` (redirects to Google), `signOut`.
- `app/(app)/analysis/[id]/actions.ts`: `createShareLink(id)` (random slug, only for completed analyses), `revokeShareLink(id)`.

---

## 8. Database (Supabase Postgres)

Defined in `supabase/migrations/`. Tested against a local Supabase stack.

### `profiles`

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid PK | references `auth.users`, cascade delete |
| `name` | text | ≤ 80 chars |
| `credits` | integer | default 3, ≥ 0 |
| `plan` | text | `free` \| `creator` \| `pro`, default `free` |
| `stripe_customer_id` | text unique | |
| `created_at` | timestamptz | |

- Created by trigger `on_auth_user_created` → `handle_new_user()`. The name comes from `name`, then `full_name` (Google), then the email prefix.
- RLS: users can select and update only their own row.
- Column privileges: `authenticated` may update `name` only. Users cannot change credits, plan or Stripe ID.

### `analyses`

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid PK | generated server-side in `/api/analyses` |
| `user_id` | uuid | default `auth.uid()`, references `profiles` |
| `video_path`, `thumbnail_path` | text | Storage paths |
| `platform` | text | `tiktok` \| `reels` \| `shorts` |
| `duration` | numeric(6,2) | seconds, ≤ 181 |
| `metadata` | jsonb | `{ caption?, niche?, goal?, fileName? }` |
| `performance_data` | jsonb | `{ views?, avgWatchPercent?, likes?, shares? }` or null |
| `frames` | jsonb | `[{ t, path }]` saved by `/api/analyze` |
| `transcript` | jsonb | `{ status: "ok", text, language, segments: [{start,end,text}] }` or `{ status: "no_audio" \| "silent" \| "unsupported" \| "failed", error? }` |
| `result` | jsonb | the validated analysis result |
| `score` | smallint | 0–100 |
| `status` | text | `uploading` → `processing` → `analyzing` → `complete` \| `failed` |
| `error` | text | user-facing failure message |
| `credit_charged` | boolean | true while a credit is held for this analysis |
| `share_slug` | text unique | ≥ 16 chars, null when not shared |
| `created_at`, `updated_at` | timestamptz | `updated_at` maintained by trigger |

- RLS: select, insert, update, delete only own rows.
- Column privileges: `authenticated` may insert only `id, platform, duration, metadata, performance_data, video_path, thumbnail_path`, and update only `share_slug`. Status, transcript, result, score and credit fields are written by server routes with the service role.
- Status flow: created as `uploading` → `/api/transcribe` sets `processing` → `consume_credit` sets `analyzing` → `/api/analyze` sets `complete` or `failed`.

### `stripe_events`

`id` (Stripe event ID, PK), `type`, `received_at`. RLS on, no policies, no grants to `anon` or `authenticated`. Used for webhook idempotency.

### Functions

| Function | Who can call | Behavior |
| --- | --- | --- |
| `consume_credit(p_analysis_id)` | service_role | Locks the analysis row. Raises `analysis_not_found`, `already_charged` or `insufficient_credits`. Decrements credits (only if > 0), sets `credit_charged = true`, `status = 'analyzing'`. Returns remaining credits |
| `refund_credit(p_analysis_id)` | service_role | If `credit_charged`, clears it and adds the credit back. Returns true/false; safe to call twice |
| `set_plan_credits(p_user_id, p_plan, p_credits)` | service_role | Sets plan and resets credits (Stripe webhook) |
| `get_shared_analysis(p_slug)` | anon, authenticated | Returns one completed analysis by exact slug (≥ 16 chars): id, platform, duration, result, score, video/thumbnail paths, created_at. No caption, no performance data, no way to list |

All are `SECURITY DEFINER` with `search_path = ''`. Execute rights on the credit functions were revoked from `public`, `anon` and `authenticated`.

### Storage

- Private bucket `videos`, 200 MB file limit, allowed types `video/mp4`, `video/quicktime`, `image/jpeg`, `audio/wav`.
- Layout: `{user_id}/{analysis_id}/video.mp4|mov`, `thumbnail.jpg`, `audio.wav`, `frames/00.jpg … 39.jpg`.
- Policies: select/insert/update/delete only when the first folder segment equals `auth.uid()`.
- Hosted Supabase Free plan caps uploads at 50 MB globally; 200 MB needs Pro.

---

## 9. Upload and analysis pipeline (end to end)

All video processing runs in the browser, so the server needs no ffmpeg. The orchestration lives in `components/upload/upload-flow.tsx`.

### Client-side validation (`handleFile`)

- Type: `video/mp4` or `video/quicktime`, or a `.mp4` / `.mov` extension when the browser reports no type.
- Size ≤ 200 MB.
- Duration ≤ 3:00 (read from video metadata; 0.5s tolerance).
- If the browser can't decode the file: "Your browser can't read this video. Export it as an H.264 MP4 and try again."

### Steps after "Analyze video"

1. Get the user's access token from the browser Supabase client.
2. `POST /api/analyses` with platform, duration, MIME type, file name, caption, niche, goal and performance data → row created, paths returned.
3. In parallel:
   - **Video upload:** XHR `POST {SUPABASE_URL}/storage/v1/object/videos/{path}` with the user's JWT, `apikey`, `x-upsert: true`, and upload progress events (`lib/video/upload.ts`). supabase-js has no progress callback, which is why XHR is used. RLS still applies.
   - **Frames** (`lib/video/frames.ts`):
     - Schedule: t = 0, 0.5, 1.0, 1.5, 2.0, 2.5 (the hook), then from 3s every 1.5s.
     - Max 40 frames. If 1.5s spacing would exceed 40, the spacing after 3s widens so the whole video is covered.
     - The last moment (duration − 0.1s) is added if the last sample is more than 0.75s before it.
     - Example counts: 10s → 12 frames, 30s → 25, 60s+ → 40.
     - Each frame: seek a hidden `<video>`, wait for `seeked` + one animation frame, draw to a 512px-wide canvas, JPEG quality 0.8 (~28 KB each).
     - Frames upload 6 at a time to `frames/NN.jpg`; frame 0 is also uploaded as `thumbnail.jpg`.
   - **Audio** (`lib/video/audio.ts`):
     - Decoded with `OfflineAudioContext` at 16 kHz (resampled during decode), mixed to mono and encoded as 16-bit WAV (3 minutes ≈ 5.8 MB), then uploaded as `audio.wav`.
     - Result states: `ok`, `no_audio` (decode failed or no track), `silent` (peak < 0.01) or `unsupported`.
4. `POST /api/transcribe` with the audio status. The server downloads `audio.wav` with the admin client (rejects files bigger than ~3:05 of WAV) and calls Whisper. A missing or failed transcript is recorded and the run continues.
5. `POST /api/analyze` with the frame list (see section 10).
6. On success the browser navigates to `/analysis/{id}`.

### Progress UI

Five steps (`components/upload/progress-steps.tsx`): Uploading (with bytes and %), Extracting frames (n of N), Transcribing (done / skipped with reason), Analyzing (elapsed timer), Done. Each step shows pending / active / done / skipped / error.

### Error handling

- **Before the analysis step:** the step turns red, the error is shown, and the half-made analysis is cleaned up: the uploaded files are removed and the row deleted, using the user's own client. "Try again" returns to the filled form.
- **During analysis:** the server has already refunded the credit. "Retry analysis" re-calls `/api/analyze` with the same frames, with no re-upload. When the error is `insufficient_credits`, the button is replaced by "See plans".
- **Leaving mid-run:** a `beforeunload` warning is active while the pipeline runs.

---

## 10. Claude analysis (`lib/analysis/claude.ts`, `app/api/analyze/route.ts`)

### Server flow in `/api/analyze`

1. Authenticate. Load the row through the user's client (RLS = ownership check).
2. If the status is `complete`, return success (idempotent). `analyzing` or `uploading` → 409.
3. Keep only frame paths matching `{user_id}/{analysis_id}/frames/NN.jpg`; clamp `t` to the duration.
4. `consume_credit` via the admin client. `insufficient_credits` → 402, `already_charged` → 409.
5. Download each frame with the admin client and base64 it.
6. Build the context: platform long name, duration, caption, niche, goal, validated performance data, stored transcript.
7. `runClaudeAnalysis` → `normalizeResult` → save `result`, `score`, `status = complete`, `frames`.
8. On any error: `refund_credit`, set `status = failed` and `error`, return 502 with a friendly message. Typed Anthropic errors map to messages: rate limit, auth, connection, other status.

### The request

| Setting | Value |
| --- | --- |
| Model | `ANTHROPIC_MODEL` env, default `claude-sonnet-5-5` |
| Call | `client.beta.messages.stream(...)` then `finalMessage()` |
| `max_tokens` | 64000 |
| Thinking | Not set (adaptive by default on this model) |
| `output_config` | `effort: "high"`, `format: { type: "json_schema", schema: analysisJsonSchema }` |
| System | `buildSystemPrompt()` with `cache_control: { type: "ephemeral" }` |
| Refusal fallback | `betas: ["server-side-fallback-2026-07-01"]`, `fallbacks: "default"`: if the model declines on policy grounds in a supported category, the API re-runs the request on a fallback model. Claude API only; remove both fields to disable |
| SDK client | `maxRetries: 2`, `timeout: 240000` ms |

### User message content, in order

1. One text block:
   - "Analyze this short-form video."
   - Platform, duration (`12.0s (0:12)`), caption, niche, goal ("Not provided" when empty).
   - "Real performance data from the creator: views 12,400, average watch 38%" or "None provided".
   - "Known missing inputs: …".
   - Transcript as `[0.0s-2.4s] text` lines, or "Unavailable: <reason>. Judge audio and script from the frames only, and list the transcript in missingInputs."
   - A note on how frames were sampled.
2. For each frame: a text block `Frame at 3.0s (0:03)` followed by a base64 JPEG image block.
3. A final text block: "Return the diagnosis as JSON now."

### Validation and retry

- The first text block is parsed with `JSON.parse`, then validated with the Zod schema in `lib/analysis/schema.ts`.
- Zod checks what JSON Schema can't express: exactly 12 areas with every id once, exactly 3 `topFixes`, score 0–100, non-empty key strings.
- `stop_reason: "refusal"` → fail (credit refunded).
- If parsing or validation fails, the request is retried once, append-only: the assistant reply (including thinking blocks, unchanged) is kept, and a user message lists the validation errors and restates the 12-id and 3-fix rules. A second failure fails the analysis.
- Each attempt logs model, stop reason, input / cache-read / output tokens.

### JSON Schema sent to the API (`lib/analysis/output-schema.ts`)

Hand-written rather than generated from Zod, because the SDK's Zod helper turned enums into plain descriptions. All objects have `additionalProperties: false`; enums are kept for area `id`, `rating` and `severity`. `timestamp` on issues is `anyOf: number | null`.

### Normalization before saving (`normalizeResult`)

- Score rounded and clamped to 0–100.
- Areas sorted into canonical order (`AREA_IDS`).
- Issue timestamps clamped to `[0, duration]`.
- Drop-off risks beyond `duration + 0.5` dropped, the rest clamped and sorted.
- Known missing inputs are always present in `missingInputs`: transcript (with reason), caption, real performance data.

### System prompt (`lib/prompts/viewscale.ts`)

- `PROMPT_IS_PLACEHOLDER = true` and `VIEWSCALE_SYSTEM_PROMPT` contain an **interim prompt**. It covers evidence-based judging, specificity, the 12 areas with definitions, scoring guidance, drop-off reasons under 6 words, and a ban on predicting view counts.
- `OUTPUT_FORMAT_INSTRUCTIONS` replaces the original prompt's "Output format" section, as the brief required: "Return only JSON matching this schema", the schema, and rules (12 areas in order, timestamps in seconds, exactly 3 top fixes, 3 hook alternatives from different angles, what belongs in `missingInputs`).
- `buildSystemPrompt()` joins the two.
- While the placeholder flag is true, the server logs a warning on the first analysis.
- **To finish:** paste the real prompt (without its own Output format section) into `VIEWSCALE_SYSTEM_PROMPT` and set the flag to false.

### Area ids and display labels

`hook` Hook · `retention` Retention · `structure` Structure · `pacing` Pacing · `clarity` Clarity · `engagement` Engagement · `triggers` Psychological triggers · `visual` Visual · `audio` Audio · `rewatch` Rewatch value · `cta` Call to action · `platformFit` Platform fit

---

## 11. Feature details by page

### Landing page (`/`)

1. **Navbar:** sticky, blurred. Logo left. Desktop links Pricing / Dashboard / Upload / Compare and a "Sign in" button; hamburger menu on mobile (animated, Escape closes).
2. **Hero:**
   - Dot-grid background and a pill badge with a lightning icon, "AI-Powered Content Diagnostics".
   - H1 "Stop guessing why your" (white) / "content doesn't scale." (lime gradient), plus the brief's subtext.
   - Buttons: "Analyze Your First Video →" (to `/upload`; signed-out users are sent to sign-in) and "View Pricing".
   - Entrance animations use tw-animate-css classes.
3. **Dashboard preview:** a static, non-interactive mock of the dashboard (`components/landing/dashboard-preview.tsx`) in a framed window with a lime glow. Sample data: "Maya", 3 credits, average 64, 12 videos, best 84, top issue "Weak hook".
4. **Live analysis preview:**
   - Label "LIVE ANALYSIS PREVIEW", H2 "Watch ViewScale dissect a video / in real time.".
   - A code-window card: three dots, "viewscale / live-analysis.tsx", a pulsing "ANALYZING" badge.
   - The Drop-off Risk chart draws in when scrolled into view. Hardcoded demo data: a 30s video with high-severity risks at 0:03 "Weak hook", 0:12 "Pacing dip", 0:24 "CTA buried", and the average shown top-right.
   - Metric cards: HOOK SCORE 42 (orange), DROP-OFFS 3 (red), CTA STRENGTH Low (red).
5. **Features:** four cards (grid on desktop). Video Forensics (brief's copy, highlighted border, "Try it →"), Hook Surgery, Algorithm Translator, Growth System. The copy for the last three was written by the AI and should be reviewed.
6. **How it works:** "From upload to growth plan / in under 60 seconds." Steps 01–04 (Drop your video, AI dissects everything, Get your diagnosis, Execute & grow) with mono lime numbers. Each fades from dim to full as it scrolls into view. The step descriptions were written by the AI.
7. **Final CTA:** "Your next video deserves / better than guessing.", subtext (AI-written), "Start Free Analysis →".
8. **Footer:** muted logo, "© 2026 ViewScale. AI-powered content diagnostics."

There is intentionally no heading above the feature cards (the brief listed none).

### Auth (`/sign-in`, `/sign-up`)

- Centered card on a dot-grid background. "Continue with Google", then email/password.
- Sign-up asks for name, email and password (min 8). If Supabase email confirmation is on, the user sees a "Check your inbox" state; locally it is off and sign-up signs in directly.
- Friendly errors for wrong password and unconfirmed email.
- `next` is preserved and sanitized by `safeNext` (only same-site relative paths).

### Dashboard (`/dashboard`)

- Title, "Welcome back, {first name} — {n} free credits left" ("credits left" on paid plans), "New Analysis" button.
- **6 tool cards** (3×2 on desktop, 2 columns on mobile): Analyze Video → `/upload`, Compare Videos → `/compare`, and four "Coming soon" cards (dimmed, `aria-disabled`).
- **Tabs (Radix):**
  - *Overview:* stat cards for average score (ring colored by score), videos analyzed, best score, top issue (orange) and credits left, plus the latest 3 analyses.
  - *Recent Analyses:* up to 50, with thumbnail, title (caption or file name), platform, duration, date and a score ring or status chip ("Failed", "Processing", or "Incomplete" for abandoned uploads).
  - *Insights:* for each of the 12 areas, a stacked bar of weak / OK / strong ratings across completed analyses, sorted weakest first, with a legend.
- **"Top issue" logic:** the brief asked for "most frequent biggest problem". `summary.biggestProblem` is free text that rarely repeats, so each analysis's biggest problem area is used instead: its weak area with the most issues. The most frequent of those is shown by area label.
- Empty states for no analyses.

### Upload (`/upload`)

Described in section 9.
- Layout: dropzone or video preview on the left; platform segmented control (TikTok / Reels / Shorts), a collapsible "Context" section (caption, niche, goal select) and a collapsible "Real performance data" section (views, average watch %, likes, shares) on the right.
- Footnote: "Uses 1 credit when the analysis starts. If it fails, the credit goes back to you."
- An out-of-credits banner links to pricing and disables submit.

### Report (`/analysis/[id]`)

- **Left column (sticky on desktop):** the embedded video player (signed URL, thumbnail as poster). On mobile it sits above the content at 200–240px wide.
- **Header card:** score ring (84px mobile / 128px desktop), platform badge, duration and date, title (caption or file name), final verdict, actions.
- **Estimated drop-off risk card:**
  - Note: "Based on content analysis, not real platform data."
  - Chart built from `dropOffRisks`: x-axis is the video duration, markers colored by severity (high red, medium orange, low lime).
  - Below it, a list of risks with timestamp chips, severity and reason.
- **Real performance data card**, only if the creator provided numbers, labeled "Real · provided by creator".
- **Summary cards:** Biggest Strength (lime), Biggest Problem (red), Biggest Opportunity (orange).
- **Top 3 Fixes** as numbered cards 01–03.
- **Hook Alternatives:** cards with the angle label and a copy button.
- **12 areas, rated:** native `<details>` accordions with a rating chip and issue count; the first weak area is open by default. Each issue shows Problem (heading) and a timestamp chip, then Evidence / Why it matters / Fix / Example.
- **What to keep** list, then "What this analysis didn't have" (missing inputs).
- **Timestamp chips** (`TimestampChip`) seek the shared `<video>` through React context, start playback and scroll the player into view if needed. Timestamps show tenths when not whole ("0:01.5").
- **Export as PDF:**
  1. Dispatches `viewscale:prepare-print` so the chart renders even if never scrolled to.
  2. Opens every accordion.
  3. Calls `window.print()` after 450 ms and restores the accordions on `afterprint`.
  4. Print CSS keeps the dark theme (`print-color-adjust: exact`), hides the navbar, footer and buttons, and prints the thumbnail in place of the video.
- **Share link:**
  - Creates a 32-character random slug (`randomBytes(24).toString("base64url")`) through the user's own client (column grant on `share_slug`), copies `NEXT_PUBLIC_SITE_URL/share/{slug}`, and shows the URL with "Stop sharing".
  - The public page uses `get_shared_analysis` and signs video URLs with the admin client. It shows a "Shared ViewScale report" banner with a sign-up CTA, and omits the caption, performance data and share controls.
- **States:**
  - `failed` → error card with "Try again" (credit already returned).
  - Not complete → "Analyzing…" card that refreshes every 4s.
  - Unreadable result → error card.

### Compare (`/compare`)

- Two selects (Video A, Video B) list completed analyses and write `?a=&b=` to the URL. Defaults: A = second newest, B = newest.
- Two columns, each with thumbnail, score ring, title, date, verdict (clamped) and "Open report".
- A sentence such as "Video B scores 25 points higher. B is stronger in 2 areas and weaker in 2."
- A table of the 12 areas with A and B rating chips and a change marker (better / worse / same; not assessed shows "—"). Rank order: weak < OK < strong.
- Empty state when fewer than 2 completed analyses exist.

### Pricing (`/pricing`)

- Driven by `lib/pricing.ts`: Free $0 (3 analyses total), Creator $19/month (30 analyses/month, labeled "Recommended"), Pro $49/month (100/month). These are placeholders the owner can edit.
- "Recommended" is used instead of "Most popular" because no usage data exists, in line with the no-fake-social-proof rule.
- Buttons:
  - Signed out: "Start free" / "Get Creator" / "Get Pro" (to sign-up).
  - Signed in: "Current plan", "Upgrade to …" (checkout), or "Manage billing" / "Change plan" (portal).
- Fine print: credits reset monthly and don't roll over, a failed analysis never uses a credit, cancel anytime.
- Failed checkout calls show an inline error (for example when Stripe isn't configured).

---

## 12. Billing (Stripe, test mode)

- **Checkout** (`/api/stripe/checkout`):
  - Users already on a paid plan with a customer ID get a billing-portal URL instead, so nobody ends up with two subscriptions.
  - Otherwise: find or create a Stripe customer (`metadata.user_id`), saved to `profiles.stripe_customer_id`.
  - Then a subscription Checkout Session with `client_reference_id = user.id`, `subscription_data.metadata = { user_id, plan }`, and promotion codes allowed.
  - Success → `/dashboard?checkout=success`; cancel → `/pricing?checkout=cancelled`.
- **Portal** (`/api/stripe/portal`): billing portal for the saved customer, returning to `/pricing`.
- **Webhook** (`/api/stripe/webhook`):
  - Verifies the signature with `STRIPE_WEBHOOK_SECRET`, then inserts the event ID into `stripe_events`. A duplicate returns `{ duplicate: true }`.
  - If a handler throws, the event row is deleted and 500 returned, so Stripe's retry is processed.
  - Events handled:

| Event | Effect |
| --- | --- |
| `checkout.session.completed` | Links the Stripe customer to the user if not linked yet |
| `invoice.paid` | Reads the subscription from `invoice.parent.subscription_details.subscription`, retrieves it, maps its price ID to a plan, finds the user (subscription metadata or customer lookup), and calls `set_plan_credits(user, plan, PLANS[plan].credits)`. Credits **reset** to the monthly allowance |
| `customer.subscription.updated` | Syncs `plan` from the price ID; status `canceled` / `unpaid` / `incomplete_expired` → `free`. Credits unchanged |
| `customer.subscription.deleted` | `plan = free`. Credits unchanged |

- The Stripe Price amounts must match `priceMonthly` in `lib/pricing.ts` (display only). Price IDs come from `STRIPE_PRICE_CREATOR` and `STRIPE_PRICE_PRO`.

---

## 13. Design system

Defined in `app/globals.css`. The app is dark-only.

| Token | Value | Usage |
| --- | --- | --- |
| Background | `#05070D` | `bg-background` |
| Card surface | `#0A0E16`, 1px border `#1A2030`, radius 16px | `surface-card` utility or `bg-card border-border rounded-2xl` |
| Raised surface | `#0F1420` | tooltips, inner chips |
| Primary / lime | `#B8FF3C` | `bg-primary`, `text-lime` |
| Headline gradient | `#C6FF3D` → `#4ADE3A` (90°) | `text-gradient-lime` |
| Heading text | `#F2F4F8` | `text-foreground` |
| Body text | `#8A93A6` | `text-muted-foreground` |
| Danger | `#EF4444` | drop-off markers, "Low", weak ratings |
| Warning | `#F59E0B` | mid scores, OK ratings, top issue |
| Icon tile | `#1A2A10`, 56px rounded square, lime icon | `<IconTile />` |
| Secondary button border | `#2A4015` (dark green) | `border-border-green` |
| Lime glow | `0 0 40px rgba(184,255,60,0.35)` | `shadow-glow` (primary buttons) |

- **Fonts:** Inter (headings bold, tight tracking) and JetBrains Mono (small uppercase letter-spaced labels, `label-mono` utility) via `next/font/google`.
- **Buttons** (`components/ui/button.tsx`):
  - `default`: lime background, black text, semibold, glow.
  - `secondary`: transparent with a dark-green border.
  - Also `outline`, `ghost`, `link`, `destructive`; sizes `sm`, `default`, `lg`, `icon`.
- **Logo:** lime rounded play triangle with a small notch cut into its back edge, plus a lowercase "viewscale" wordmark (`components/brand/logo.tsx`; `variant="muted"` in the footer). `app/icon.svg` is the favicon version.
- **Score colors** (`scoreTone`): ≥ 70 lime, 45–69 orange, < 45 red.
- **Other utilities:** `bg-dot-grid` (hero dot pattern with radial fade).
- **Motion:** Framer Motion respects `prefers-reduced-motion` (`MotionProvider`); CSS animations use `motion-reduce:animate-none`.

### Drop-off chart (`components/charts/drop-off-chart.tsx`, `lib/drop-off.ts`)

- The line is an **estimated risk curve**, not retention data. Formula (`riskAt`):
  - baseline 16 plus a small sine wobble,
  - plus a Gaussian bump at each risk (amplitude low 20, medium 36, high 54; sigma = max(3.5% of duration, 0.6s)),
  - clamped to 3–97.
- Sampled at 81 points plus each risk timestamp, so markers sit exactly on the line.
- Recharts `ComposedChart` with a gradient `Area` and a 2px lime `Line` with an SVG glow filter.
- It mounts when 35% visible (`useInView`, once), so the draw-in animation plays on scroll.
- Markers fade in after the line. Two-line labels (timestamp, reason ≤ 22 chars) flip below on collision and are dropped if neither fits.
- Hover tooltip with crosshair; screen-reader text lists every risk.

---

## 14. Environment variables (`.env.example`)

| Variable | Side | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | public | Base URL for share links (and an auth fallback) |
| `NEXT_PUBLIC_SUPABASE_URL` | public | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | public | Anon / publishable key (RLS protects data) |
| `SUPABASE_SERVICE_ROLE_KEY` | server | Admin client: credits, results, signing shared files, webhook |
| `ANTHROPIC_API_KEY` | server | Claude |
| `ANTHROPIC_MODEL` | server | Optional, default `claude-sonnet-5-5` |
| `OPENAI_API_KEY` | server | Whisper |
| `STRIPE_SECRET_KEY` | server | Stripe API |
| `STRIPE_WEBHOOK_SECRET` | server | Webhook signature |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | public | Listed for completeness; Checkout is a redirect, so it is not used in code yet |
| `STRIPE_PRICE_CREATOR`, `STRIPE_PRICE_PRO` | server | Stripe Price IDs |

The SDKs also honor `ANTHROPIC_BASE_URL` and `OPENAI_BASE_URL`, which is how local mocks were wired during testing (not needed in production). `.gitignore` ignores `.env*` except `.env.example`.

---

## 15. How it was tested

There is no automated test suite in the repo; adding a test framework would be a new dependency and needs the owner's approval. Verification was done with:

- **Local Supabase in Docker** (`npx supabase start` with this repo's `supabase/config.toml` and migrations), with a scripted headless browser (Playwright, outside the repo).
- **Database:**
  - Users can't read each other's rows.
  - Users can't edit credits, plan, results or status.
  - The credit functions are not callable by users.
  - A credit can't be charged twice for one analysis; refunds are idempotent.
  - Share-by-slug works; storage folder policies hold.
- **Auth:** sign-up, wrong-password and validation errors, protected-route redirect, signed-in redirect away from auth pages, sign-out. One bug found and fixed: the name field cleared after a failed sign-up.
- **Upload pipeline with generated test videos:**
  - Validation errors for a non-video, a 3:05 video and an undecodable file.
  - Upload with progress; frames extracted at exact timestamps (checked by reading the burned-in frame counter).
  - WAV of exactly the expected size.
  - No-audio video correctly reported.
- **Analysis**, with a **local mock** of the Anthropic Messages API (SSE) and Whisper:
  - The request shape was checked: beta header, `fallbacks: "default"`, `effort`, JSON schema, cache control, image count, transcript text.
  - An invalid first reply triggers the retry with validation errors.
  - The result saves; credit 3 → 2; out-of-range risks are removed.
  - A 500 from the API → credit refunded, `failed` status, then "Retry analysis" succeeds.
- **Report:** timestamp chips seek the player, copy works, share link created and opens signed out without private fields, PDF output renders dark with the chart, mobile layout.
- **Stripe webhook**, with locally signed events: bad signature rejected, customer linked, plan set from price ID, duplicate ignored, cancellation → free.
- **Pages:** dashboard, pricing and compare screenshots at desktop and mobile widths.

**Not verified:**
- Real Claude, Whisper and Stripe API calls (no keys available), including the `invoice.paid` path, which calls the Stripe API.
- Google OAuth.
- H.264 decoding: the headless Chromium used lacks proprietary codecs, so VP9 MP4s were used. Real Chrome, Safari and Edge decode H.264.

---

## 15a. Error handling and missing setup

- `getUser()` never throws. With Supabase not configured or unreachable, the visitor is treated as signed out (it re-throws Next.js control-flow errors with `unstable_rethrow`). Public pages therefore render without any keys.
- Without Supabase keys: sign-in/sign-up show a "Supabase isn't connected yet" notice, the auth actions return that message instead of throwing, protected pages redirect to sign-in, and share links 404.
- With keys but no tables (migrations not run) or no profile row: dashboard, compare and upload show "Your account isn't set up in the database" (`components/site/setup-notice.tsx`). `getAnalyses` throws a `DataError` carrying the Postgres/PostgREST code; `isMissingSchema()` checks for `42P01` / `PGRST205`.
- Any other server error lands in an error boundary: `app/(app)/error.tsx` (inside the app shell), `app/error.tsx` (public pages, with navbar and footer) and `app/global-error.tsx` (root layout failures). They show an error ID (the `digest`) that matches the full message in the server logs, plus "Try again" (`retry()`, Next 16's re-fetching reset) and "Go home".
- Production browsers only ever see a generic message ("Minified React error #441" in the console); the real message is in the server logs.

## 16. Known limitations and suggested next steps

### Owner actions

1. Paste the real system prompt into `lib/prompts/viewscale.ts` and set `PROMPT_IS_PLACEHOLDER = false`.
2. Provide the 5 design screenshots so the UI can be matched precisely.
3. Review the AI-written copy:
   - Hook Surgery, Algorithm Translator and Growth System card text
   - How-it-works step descriptions
   - Final CTA subtext
   - Dashboard tool descriptions
   - Pricing taglines and features
4. Set real prices in `lib/pricing.ts` and create matching Stripe Prices.
5. Deploy (Vercel is the simplest) and configure Supabase redirect URLs, Google OAuth, Stripe webhook endpoint and env vars.

### Technical limitations

- **Supabase Free plan** caps uploads at 50 MB; 200 MB needs Pro.
- **Long analyses:** `/api/analyze` can take one to two minutes (`maxDuration` 300). Check the hosting plan's function time limit.
- **Browser decoding:** extraction depends on the browser decoding the video. HEVC `.mov` files may fail in Chrome; the app asks for an H.264 MP4.
- **Abandoned uploads** stay as `uploading` rows ("Incomplete" on the dashboard), and their files stay in Storage. There is no cleanup job. Files of failed analyses are also kept.
- **Out of credits at analysis time:** if a user runs out between upload and analysis, the row stays `processing` and they must re-upload after buying credits. These rows also count toward the 3-in-progress cap for one hour.
- **Credits reset** to the plan allowance on each paid invoice (no rollover), and leftover free credits are replaced.
- **Missing account features:** no account settings page (rename, delete account), no password reset, no UI to delete an analysis (RLS already allows it).
- **Marketing navbar** always shows "Sign in", even when signed in.
- **Share page 404:** an invalid slug renders the not-found UI with HTTP 200, because streaming started before `notFound()`.
- **Dashboard and compare limits:** the dashboard loads the 50 most recent analyses and compare loads 100.
- **Coming-soon tools** (Creator Identity, Analytics Translator, Repurpose Engine, Growth Plan) have no implementation.
- **No automated tests or CI.**

---

## 17. Working conventions for this repository

- Read `AGENTS.md`: this is Next.js 16; check `node_modules/next/dist/docs/` before relying on older patterns.
- Keep request-dependent reads inside `<Suspense>` and keep skeleton fallbacks in the dark card style.
- Only server code may use `lib/supabase/admin.ts` (service role), and only after checking that the signed-in user owns the row.
- New tables need RLS enabled and explicit grants. Credit changes must go through the SQL functions.
- Don't add dependencies outside the agreed stack without asking the owner.
- Never show predicted view counts; keep the drop-off chart labeled as an estimate and real data labeled as real.
- Run `npm run lint`, `npm run typecheck` and `npm run build` before committing.
- Commit history so far:

| Commit | Step |
| --- | --- |
| `a3cc1ee` | Scaffold, tokens, logo, landing |
| `42bd97b` | Auth, schema, dashboard |
| `04b3609` | Upload, frames, transcription |
| `9bd6ce3` | Claude analysis route and report |
| `2098219` | Compare, pricing, Stripe |
