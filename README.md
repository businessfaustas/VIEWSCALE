# ViewScale

ViewScale analyzes short-form videos (TikTok, Instagram Reels, YouTube Shorts) and explains what limits their performance, with timestamped problems and exact fixes.

## Stack

- Next.js 16 (App Router, TypeScript, Cache Components), Tailwind CSS v4, shadcn/ui (Radix), lucide-react, Framer Motion, Recharts
- Supabase (auth, Postgres, Storage), Anthropic API (analysis), OpenAI Whisper (transcription) and Stripe (credits/subscriptions), all coming in later build steps

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in keys as each step needs them
npm run dev                  # http://localhost:3000
```

### Supabase

**Hosted project**

1. Create a project at supabase.com.
2. Run the migration: `npx supabase link --project-ref <ref>` then `npx supabase db push`
   (or paste `supabase/migrations/*.sql` into the SQL editor).
3. Copy the project URL, anon key and service role key into `.env.local`.
4. Auth → URL Configuration: set Site URL to your app URL and add
   `<your-url>/auth/callback` to the redirect URLs.
5. Google sign-in: Auth → Providers → Google. Create an OAuth client in Google Cloud
   with the redirect URI Supabase shows you, and paste the client ID and secret.
6. Video uploads up to 200 MB need the Pro plan (the Free plan caps files at 50 MB).
   Raise the global file size limit under Storage → Settings.

**Local (Docker)**

```bash
npx supabase start          # applies supabase/migrations, prints local keys
```

Put the printed API URL, anon key and service role key in `.env.local`. Email
confirmation is off locally, so sign-up logs you straight in.

### Data model

- `profiles`: one row per user (created by a trigger on sign-up), `credits` defaults to 3.
- `analyses`: one row per video, with inputs, transcript, result JSON, score and status.
- RLS is on for both tables. Users read and write only their own rows, and column
  privileges stop them from editing credits, plan, status or results. Those are written
  by server routes with the service role.
- Credits change only through `consume_credit`, `refund_credit` and `set_plan_credits`,
  which are atomic and executable by the service role only.
- Shared reports are read through `get_shared_analysis(slug)`, which returns one
  analysis by its exact slug and leaves out private inputs.
- Storage: private `videos` bucket, one folder per user (`{user_id}/{analysis_id}/...`).

| Script | What it does |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm run typecheck` | Generates route types, then runs `tsc` |
| `npm run lint` | ESLint |

## Design system

Tokens live in `app/globals.css` (`:root` + `@theme`). The app is dark-only.

| Token | Value | Tailwind |
| --- | --- | --- |
| Background | `#05070D` | `bg-background` |
| Card surface | `#0A0E16`, 1px `#1A2030` border, 16px radius | `surface-card` or `bg-card border-border rounded-2xl` |
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
app/                    routes: landing, (auth) sign-in/up, (app) dashboard…, auth callbacks
proxy.ts                session refresh + auth redirects (Next 16's "middleware")
supabase/               config.toml + SQL migrations
components/brand/       Logo + LogoMark (SVG)
components/site/        Navbar, Footer, SectionHeading
components/landing/     landing page sections
components/charts/      DropOffChart (shared by the landing preview and the report page)
components/app/         ScoreRing, StatCard, IconTile (shared with the dashboard)
components/auth/        sign-in / sign-up forms
components/dashboard/   dashboard tabs, lists, insights
components/ui/          shadcn/ui primitives
lib/supabase/           browser, server, admin (service role) and proxy clients
lib/analysis/           result schema (Zod) and dashboard stats
lib/                    auth helpers, data loaders, env, utils, drop-off curve math
```

## Build plan

1. ✅ Scaffold, design tokens, logo, landing page
2. ✅ Auth, database schema, dashboard shell
3. Upload, frame extraction, transcription
4. Claude analysis route and report page
5. Compare, pricing, Stripe

## Notes

- shadcn/ui components are written by hand in `components/ui/`, matching the `new-york` style and `components.json`, so `npx shadcn add <component>` works on a normal machine.
- The landing page "Live analysis preview" uses hardcoded demo data. It never shows view-count predictions.
