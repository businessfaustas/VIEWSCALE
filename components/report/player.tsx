"use client";

import { createContext, use, useCallback, useRef, type ReactNode, type RefObject } from "react";
import { Play } from "lucide-react";

import { cn, formatMoment } from "@/lib/utils";

type PlayerContextValue = {
  videoRef: RefObject<HTMLVideoElement | null>;
  seek: (t: number) => void;
};

const PlayerContext = createContext<PlayerContextValue | null>(null);

/** Shares the report's <video> so timestamp chips anywhere on the page can seek it. */
export function ReportPlayerProvider({ children }: { children: ReactNode }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const seek = useCallback((t: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = t;
    void video.play().catch(() => {});
    const rect = video.getBoundingClientRect();
    if (rect.bottom < 80 || rect.top > window.innerHeight - 80) {
      video.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, []);

  return <PlayerContext value={{ videoRef, seek }}>{children}</PlayerContext>;
}

export function ReportVideo({ src, poster }: { src: string | null; poster: string | null }) {
  const ctx = use(PlayerContext);
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-black">
      <div className="aspect-[9/16] w-full">
        {src ? (
          <video
            ref={ctx?.videoRef}
            src={src}
            poster={poster ?? undefined}
            controls
            playsInline
            preload="metadata"
            className="size-full object-contain print:hidden"
          />
        ) : (
          <div className="flex size-full items-center justify-center p-6 text-center text-sm text-muted-foreground print:hidden">
            Video unavailable
          </div>
        )}
        {poster && (
          // Printed reports show the thumbnail in place of the player.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={poster} alt="" className="hidden size-full object-contain print:block" />
        )}
      </div>
    </div>
  );
}

/** "▶ 0:03" chip that jumps the report's player to that moment. */
export function TimestampChip({ t, className }: { t: number; className?: string }) {
  const ctx = use(PlayerContext);
  return (
    <button
      type="button"
      onClick={() => ctx?.seek(t)}
      aria-label={`Play from ${formatMoment(t)}`}
      className={cn(
        "inline-flex h-7 shrink-0 cursor-pointer items-center gap-1.5 rounded-full border border-lime/30 bg-lime/[0.07] px-2.5 font-mono text-xs font-medium text-lime transition-colors hover:border-lime/60 hover:bg-lime/[0.12] focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:outline-none",
        className,
      )}
    >
      <Play className="size-3 fill-lime" aria-hidden="true" />
      {formatMoment(t)}
    </button>
  );
}
