import Link from "next/link";

import { Logo } from "@/components/brand/logo";

export function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-4 px-4 py-8 sm:flex-row sm:items-center sm:px-6">
        <Link href="/" aria-label="ViewScale home" className="opacity-80 transition-opacity hover:opacity-100">
          <Logo variant="muted" />
        </Link>
        <p className="text-sm text-muted-foreground">
          © 2026 ViewScale. AI-powered content diagnostics.
        </p>
      </div>
    </footer>
  );
}
