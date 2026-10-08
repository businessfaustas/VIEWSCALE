import Link from "next/link";
import { Coins, LogOut } from "lucide-react";

import { signOut } from "@/app/(auth)/actions";
import { UserMenuDropdown } from "@/components/app/user-menu-dropdown";
import { Button } from "@/components/ui/button";
import { getProfile } from "@/lib/data";

/** Credits pill + account menu. Reads the session: render inside <Suspense>. */
export async function UserMenu({ variant = "desktop" }: { variant?: "desktop" | "mobile" }) {
  const profile = await getProfile();

  if (!profile) {
    return (
      <Button asChild variant="secondary" size={variant === "mobile" ? "default" : "sm"} className={variant === "mobile" ? "w-full" : undefined}>
        <Link href="/sign-in">Sign in</Link>
      </Button>
    );
  }

  const name = profile.name || profile.email || "Creator";

  if (variant === "mobile") {
    return (
      <div className="space-y-3 rounded-xl border border-border bg-card p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{name}</p>
            {profile.email && <p className="truncate text-xs text-muted-foreground">{profile.email}</p>}
          </div>
          <CreditsPill credits={profile.credits} />
        </div>
        <form action={signOut}>
          <Button type="submit" variant="secondary" className="w-full">
            <LogOut className="size-4" aria-hidden="true" />
            Sign out
          </Button>
        </form>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <CreditsPill credits={profile.credits} />
      <UserMenuDropdown name={name} email={profile.email} plan={profile.plan} />
    </div>
  );
}

function CreditsPill({ credits }: { credits: number }) {
  return (
    <Link
      href="/pricing"
      className="inline-flex h-8 items-center gap-1.5 rounded-full border border-lime/25 bg-lime/[0.06] px-3 font-mono text-xs font-medium text-lime transition-colors hover:border-lime/45"
      aria-label={`${credits} credits left. View plans`}
    >
      <Coins className="size-3.5" aria-hidden="true" />
      {credits} {credits === 1 ? "credit" : "credits"}
    </Link>
  );
}
