import * as React from "react";

import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "flex h-11 w-full min-w-0 rounded-xl border border-border bg-background px-3.5 text-[15px] text-foreground transition-[border-color,box-shadow] outline-none placeholder:text-muted-foreground/60 sm:text-sm",
        "focus-visible:border-lime/50 focus-visible:ring-3 focus-visible:ring-lime/15",
        "aria-invalid:border-danger/70 aria-invalid:ring-danger/15",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "file:border-0 file:bg-transparent file:text-sm file:font-medium",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
