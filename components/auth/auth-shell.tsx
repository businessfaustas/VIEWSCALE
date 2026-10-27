import Link from "next/link";

import { Logo } from "@/components/brand/logo";

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
  notice,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  /** Shown above the card, e.g. a setup warning. */
  notice?: React.ReactNode;
}) {
  return (
    <main className="relative flex flex-1 flex-col items-center justify-center overflow-hidden px-4 py-12">
      <div aria-hidden="true" className="bg-dot-grid pointer-events-none absolute inset-0" />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-[-160px] left-1/2 h-[380px] w-[620px] -translate-x-1/2 rounded-full bg-lime/[0.07] blur-[110px]"
      />
      <div className="relative w-full max-w-[420px]">
        <Link href="/" aria-label="ViewScale home" className="mx-auto mb-8 flex w-fit">
          <Logo />
        </Link>
        {notice && <div className="mb-6">{notice}</div>}
        <div className="surface-card p-6 shadow-[0_30px_80px_-40px_rgba(0,0,0,0.9)] sm:p-8">
          <h1 className="text-2xl tracking-tight">{title}</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>
          <div className="mt-7">{children}</div>
        </div>
        {footer && <div className="mt-6 text-center text-sm text-muted-foreground">{footer}</div>}
      </div>
    </main>
  );
}

export function AuthCardSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true">
      <div className="h-11 animate-pulse rounded-xl bg-[#121826]" />
      <div className="h-px bg-border" />
      <div className="h-11 animate-pulse rounded-xl bg-[#121826]" />
      <div className="h-11 animate-pulse rounded-xl bg-[#121826]" />
      <div className="h-11 animate-pulse rounded-xl bg-[#1a2a10]" />
    </div>
  );
}
