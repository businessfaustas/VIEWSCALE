import { cn } from "@/lib/utils";

export function StatCard({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("surface-card flex flex-col justify-between gap-3 p-4", className)}>
      <p className="label-mono text-[10px] text-muted-foreground">{label}</p>
      <div>{children}</div>
    </div>
  );
}
