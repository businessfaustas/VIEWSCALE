"use client";

import { motion } from "framer-motion";

import { SectionHeading } from "@/components/site/section-heading";

const steps = [
  {
    n: "01",
    title: "Drop your video",
    body: "Upload a TikTok, Reel or Short. MP4 or MOV, up to 3 minutes.",
  },
  {
    n: "02",
    title: "AI dissects everything",
    body: "Frames, transcript, pacing and hook are checked across 12 performance areas.",
  },
  {
    n: "03",
    title: "Get your diagnosis",
    body: "A scored report with timestamped problems and why each one costs you viewers.",
  },
  {
    n: "04",
    title: "Execute & grow",
    body: "Apply the exact fixes, post the stronger cut, and compare versions side by side.",
  },
];

export function HowItWorks() {
  return (
    <section
      aria-labelledby="how-it-works-title"
      className="border-t border-border/60 bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(184,255,60,0.05),transparent)]"
    >
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
        <SectionHeading
          id="how-it-works-title"
          label="How it works"
          title="From upload to growth plan"
          accent="in under 60 seconds."
        />

        <ol className="mt-14 grid gap-x-8 gap-y-2 sm:mt-16 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((step) => (
            <motion.li
              key={step.n}
              initial={{ opacity: 0.18 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true, amount: 0.9 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
              className="border-t border-border py-7"
            >
              <span className="font-mono text-sm font-semibold tracking-wider text-lime">
                {step.n}
              </span>
              <h3 className="mt-3 text-xl font-semibold tracking-tight">{step.title}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">{step.body}</p>
            </motion.li>
          ))}
        </ol>
      </div>
    </section>
  );
}
