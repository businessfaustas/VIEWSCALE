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
app/                    routes (landing page, not-found, icon)
components/brand/       Logo + LogoMark (SVG)
components/site/        Navbar, Footer, SectionHeading
components/landing/     landing page sections
components/charts/      DropOffChart (shared by the landing preview and the report page)
components/app/         ScoreRing, StatCard, IconTile (shared with the dashboard)
components/ui/          shadcn/ui primitives
lib/                    utils, drop-off curve math, dashboard tool config
```

## Build plan

1. ✅ Scaffold, design tokens, logo, landing page
2. Auth, database schema, dashboard shell
3. Upload, frame extraction, transcription
4. Claude analysis route and report page
5. Compare, pricing, Stripe

## Notes

- shadcn/ui components are written by hand in `components/ui/`, matching the `new-york` style and `components.json`, so `npx shadcn add <component>` works on a normal machine.
- The landing page "Live analysis preview" uses hardcoded demo data. It never shows view-count predictions.
