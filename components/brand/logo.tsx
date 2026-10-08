import type { SVGProps } from "react";

import { cn } from "@/lib/utils";

/**
 * The ViewScale mark: a rounded play triangle with a small notch cut into
 * its back edge. Inherits color from `currentColor`.
 */
export function LogoMark({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={cn("size-6", className)}
      {...props}
    >
      <path
        d="M5.5 3.6 20.4 12 5.5 20.4V14l2.9-2-2.9-2Z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinejoin="round"
      />
    </svg>
  );
}

type LogoProps = {
  variant?: "default" | "muted";
  className?: string;
  markClassName?: string;
};

export function Logo({ variant = "default", className, markClassName }: LogoProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 select-none",
        variant === "muted" ? "text-muted-foreground" : "text-lime",
        className,
      )}
    >
      <LogoMark className={cn("size-[22px]", markClassName)} />
      <span className="text-[19px] leading-none font-bold tracking-[-0.03em] lowercase">
        viewscale
      </span>
    </span>
  );
}
