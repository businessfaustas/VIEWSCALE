import * as React from "react";

import { cn } from "@/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex min-h-24 w-full rounded-xl border border-border bg-background px-3.5 py-3 text-[15px] text-foreground transition-[border-color,box-shadow] outline-none placeholder:text-muted-foreground/60 sm:text-sm",
        "focus-visible:border-lime/50 focus-visible:ring-3 focus-visible:ring-lime/15",
        "aria-invalid:border-danger/70 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
