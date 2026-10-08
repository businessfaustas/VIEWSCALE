import Link from "next/link";
import { ArrowRight, Languages, ScanSearch, Scissors, TrendingUp, type LucideIcon } from "lucide-react";

import { IconTile } from "@/components/app/icon-tile";
import { cn } from "@/lib/utils";

type Feature = {
  title: string;
  description: string;
  icon: LucideIcon;
  href?: string;
  highlighted?: boolean;
};

const features: Feature[] = [
  {
    title: "Video Forensics",
    description:
      "Second-by-second breakdown of why viewers leave. Exact timestamps, exact reasons, exact fixes.",
    icon: ScanSearch,
    href: "/upload",
    highlighted: true,
  },
  {
    title: "Hook Surgery",
    description:
      "Your first three seconds, dissected. See why the scroll wins — and get rewritten hooks built to stop it.",
    icon: Scissors,
  },
  {
    title: "Algorithm Translator",
    description:
      "What TikTok, Reels and Shorts actually reward, in plain language. Know which signals your video sends.",
    icon: Languages,
  },
  {
    title: "Growth System",
    description:
      "Turn every diagnosis into a repeatable playbook. Each fix compounds, so every video starts stronger than the last.",
    icon: TrendingUp,
  },
];

export function Features() {
  return (
    <section aria-label="Features" className="mx-auto max-w-6xl px-4 pb-20 sm:px-6 sm:pb-28">
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {features.map((f) => (
          <li
            key={f.title}
            className={cn(
              "group relative flex flex-col rounded-2xl border bg-card p-6 transition-colors",
              f.highlighted
                ? "border-lime/40 bg-gradient-to-b from-lime/[0.06] to-card shadow-[0_0_40px_-12px_rgba(184,255,60,0.35)]"
                : "border-border hover:border-[#262e44]",
            )}
          >
            <IconTile icon={f.icon} />
            <h3 className="mt-6 text-lg font-semibold tracking-tight">{f.title}</h3>
            <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">{f.description}</p>
            {f.href && (
              <Link
                href={f.href}
                className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-lime after:absolute after:inset-0 after:rounded-2xl focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-ring/70"
              >
                Try it
                <ArrowRight
                  className="size-4 transition-transform group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </Link>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
