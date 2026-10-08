"use client";

import { Suspense, useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";

import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type NavLink = { href: string; label: string };

const marketingLinks: NavLink[] = [
  { href: "/pricing", label: "Pricing" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/upload", label: "Upload" },
  { href: "/compare", label: "Compare" },
];

type NavbarProps = {
  links?: NavLink[];
  /** Right side on desktop. Defaults to a "Sign in" button. */
  desktopActions?: ReactNode;
  /** Bottom of the mobile menu. Defaults to a "Sign in" button. */
  mobileActions?: ReactNode;
};

export function Navbar({ links = marketingLinks, desktopActions, mobileActions }: NavbarProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/75 backdrop-blur-xl print:hidden">
      <nav
        aria-label="Main"
        className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6"
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
          {/* The current path is request data on dynamic routes, so it streams in. */}
          <Suspense fallback={<NavLinks links={links} variant="desktop" />}>
            <ActiveNavLinks links={links} variant="desktop" />
          </Suspense>
          <div className="ml-3 flex items-center">
            {desktopActions ?? (
              <Button asChild variant="secondary" size="sm">
                <Link href="/sign-in">Sign in</Link>
              </Button>
            )}
          </div>
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
              <Suspense
                fallback={<NavLinks links={links} variant="mobile" onNavigate={() => setOpen(false)} />}
              >
                <ActiveNavLinks links={links} variant="mobile" onNavigate={() => setOpen(false)} />
              </Suspense>
              <li
                className="mt-2"
                onClick={(e) => {
                  if ((e.target as HTMLElement).closest("a")) setOpen(false);
                }}
              >
                {mobileActions ?? (
                  <Button asChild variant="secondary" className="w-full">
                    <Link href="/sign-in" onClick={() => setOpen(false)}>
                      Sign in
                    </Link>
                  </Button>
                )}
              </li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

type NavLinksProps = {
  links: NavLink[];
  variant: "desktop" | "mobile";
  onNavigate?: () => void;
  pathname?: string | null;
};

function ActiveNavLinks(props: Omit<NavLinksProps, "pathname">) {
  return <NavLinks {...props} pathname={usePathname()} />;
}

function NavLinks({ links, variant, onNavigate, pathname = null }: NavLinksProps) {
  const isActive = (href: string) =>
    pathname !== null && (pathname === href || pathname.startsWith(`${href}/`));

  if (variant === "desktop") {
    return links.map((link) => (
      <Link
        key={link.href}
        href={link.href}
        aria-current={isActive(link.href) ? "page" : undefined}
        className={cn(
          "rounded-lg px-3.5 py-2 text-sm font-medium transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:outline-none",
          isActive(link.href) ? "text-foreground" : "text-muted-foreground",
        )}
      >
        {link.label}
      </Link>
    ));
  }

  return links.map((link) => (
    <li key={link.href}>
      <Link
        href={link.href}
        onClick={onNavigate}
        aria-current={isActive(link.href) ? "page" : undefined}
        className={cn(
          "block rounded-xl px-3 py-3 text-[15px] font-medium transition-colors hover:bg-white/[0.04] hover:text-foreground",
          isActive(link.href) ? "bg-white/[0.04] text-foreground" : "text-foreground/85",
        )}
      >
        {link.label}
      </Link>
    </li>
  ));
}
