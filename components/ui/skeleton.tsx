import { cn } from "@/lib/utils";

/** Loading placeholder in the dark card style. */
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden="true"
      className={cn("animate-pulse rounded-xl bg-[#121826] motion-reduce:animate-none", className)}
      {...props}
    />
  );
}

export { Skeleton };
