"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";

import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";

const links = [
  { href: "/pricing", label: "Pricing" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/upload", label: "Upload" },
  { href: "/compare", label: "Compare" },
] as const;

export function Navbar() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/75 backdrop-blur-xl">
      <nav
        aria-label="Main"
        className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6"
      >
        <Link
          href="/"
          aria-label="ViewScale home"
          className="rounded-md focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:outline-none"
          onClick={() => setOpen(false)}
        >
          <Logo />
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg px-3.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:outline-none"
            >
              {link.label}
            </Link>
          ))}
          <Button asChild variant="secondary" size="sm" className="ml-3">
            <Link href="/sign-in">Sign in</Link>
          </Button>
        </div>

        <button
          type="button"
          className="-mr-2 inline-flex size-10 items-center justify-center rounded-lg text-foreground transition-colors hover:bg-white/[0.04] focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:outline-none md:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          aria-controls="mobile-menu"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </nav>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id="mobile-menu"
            key="mobile-menu"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden border-t border-border/70 md:hidden"
          >
            <ul className="flex flex-col gap-1 px-4 pt-3 pb-5">
              {links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="block rounded-xl px-3 py-3 text-[15px] font-medium text-foreground/90 transition-colors hover:bg-white/[0.04] hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
              <li className="mt-2">
                <Button asChild variant="secondary" className="w-full">
                  <Link href="/sign-in" onClick={() => setOpen(false)}>
                    Sign in
                  </Link>
                </Button>
              </li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
