import { cn, scoreTone, toneColor } from "@/lib/utils";

type ScoreRingProps = {
  score: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  /** Shows a small "/100" under the number. */
  showMax?: boolean;
};

/** Circular 0-100 score, colored lime / orange / red by score. */
export function ScoreRing({
  score,
  size = 88,
  strokeWidth = 7,
  className,
  showMax = false,
}: ScoreRingProps) {
  const value = Math.max(0, Math.min(100, Math.round(score)));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const color = toneColor[scoreTone(value)];

  return (
    <div
      role="img"
      aria-label={`Score ${value} out of 100`}
      className={cn("relative inline-grid shrink-0 place-items-center", className)}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--border)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - value / 100)}
          style={{ filter: `drop-shadow(0 0 6px color-mix(in srgb, ${color} 45%, transparent))` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
        <span
          className="font-bold tracking-tight text-foreground"
          style={{ fontSize: Math.round(size * 0.3) }}
        >
          {value}
        </span>
        {showMax && (
          <span className="mt-1 font-mono text-[10px] text-muted-foreground">/100</span>
        )}
      </div>
    </div>
  );
}
