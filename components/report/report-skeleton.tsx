import { Skeleton } from "@/components/ui/skeleton";

export function ReportSkeleton() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12" aria-busy="true" aria-label="Loading report">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,290px)_minmax(0,1fr)] lg:gap-10">
        <Skeleton className="mx-auto aspect-[9/16] w-full max-w-[240px] rounded-2xl lg:max-w-none" />
        <div className="space-y-6">
          <div className="surface-card flex items-center gap-6 p-7">
            <Skeleton className="size-32 shrink-0 rounded-full" />
            <div className="flex-1 space-y-3">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </div>
          <Skeleton className="h-[380px] rounded-2xl" />
          <div className="grid gap-4 md:grid-cols-3">
            <Skeleton className="h-36 rounded-2xl" />
            <Skeleton className="h-36 rounded-2xl" />
            <Skeleton className="h-36 rounded-2xl" />
          </div>
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-16 rounded-2xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
