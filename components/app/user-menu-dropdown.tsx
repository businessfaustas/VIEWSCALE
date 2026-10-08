"use client";

import { useRef } from "react";
import Link from "next/link";
import { CreditCard, LogOut } from "lucide-react";

import { signOut } from "@/app/(auth)/actions";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Plan } from "@/lib/database.types";

const PLAN_LABEL: Record<Plan, string> = { free: "Free plan", creator: "Creator plan", pro: "Pro plan" };

export function UserMenuDropdown({
  name,
  email,
  plan,
}: {
  name: string;
  email: string | null;
  plan: Plan;
}) {
  const signOutForm = useRef<HTMLFormElement>(null);

  return (
    <DropdownMenu modal={false}>
      <form ref={signOutForm} action={signOut} className="hidden" />
      <DropdownMenuTrigger
        className="inline-flex size-9 cursor-pointer items-center justify-center rounded-full border border-border bg-surface-raised text-sm font-semibold text-foreground uppercase transition-colors outline-none hover:border-[#2a3247] focus-visible:ring-2 focus-visible:ring-ring/70"
        aria-label="Account menu"
      >
        {name.slice(0, 1)}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>
          <p className="truncate font-semibold">{name}</p>
          {email && <p className="truncate text-xs text-muted-foreground">{email}</p>}
          <p className="label-mono mt-2 text-[10px] text-lime">{PLAN_LABEL[plan]}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/pricing">
            <CreditCard aria-hidden="true" />
            Plans & credits
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => signOutForm.current?.requestSubmit()}>
          <LogOut aria-hidden="true" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
