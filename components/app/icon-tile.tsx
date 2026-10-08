import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

/** Lime icon inside a dark-green rounded square (56px by default). */
export function IconTile({
  icon: Icon,
  className,
  iconClassName,
}: {
  icon: LucideIcon;
  className?: string;
  iconClassName?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex size-14 shrink-0 items-center justify-center rounded-2xl bg-icon-tile text-lime ring-1 ring-lime/10 ring-inset",
        className,
      )}
    >
      <Icon className={cn("size-6", iconClassName)} strokeWidth={1.9} aria-hidden="true" />
    </span>
  );
}
