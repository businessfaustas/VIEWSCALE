"use client";

import { useId, useMemo, useRef } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  usePlotArea,
  useXAxisScale,
  useYAxisScale,
  type TooltipContentProps,
} from "recharts";

import {
  buildRiskCurve,
  chartColors,
  riskAt,
  severityColor,
  timeTicks,
  type DropOffRisk,
} from "@/lib/drop-off";
import { cn, formatTimestamp } from "@/lib/utils";

type DropOffChartProps = {
  risks: DropOffRisk[];
  duration: number;
  height?: number;
  className?: string;
  /** Seconds the draw-in animation takes once the chart scrolls into view. */
  drawDuration?: number;
};

const MONO = "var(--font-jetbrains-mono), ui-monospace, monospace";
const DRAW_MS = 1800;

export function DropOffChart({
  risks,
  duration,
  height = 240,
  className,
  drawDuration = DRAW_MS,
}: DropOffChartProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.35 });
  const reduce = useReducedMotion() ?? false;
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");

  const { points } = useMemo(() => buildRiskCurve(risks, duration), [risks, duration]);
  const ticks = useMemo(() => timeTicks(duration), [duration]);
  const animate = !reduce;

  return (
    <div ref={ref} className={cn("w-full", className)} style={{ height }}>
      <p className="sr-only">
        Estimated drop-off risk across {formatTimestamp(duration)}.{" "}
        {risks
          .map((r) => `${formatTimestamp(r.timestamp)}: ${r.reason} (${r.severity} risk)`)
          .join(". ")}
      </p>
      {inView && (
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={points} margin={{ top: 60, right: 18, bottom: 0, left: 18 }}>
            <defs>
              <linearGradient id={`${id}-fill`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={chartColors.line} stopOpacity={0.32} />
                <stop offset="100%" stopColor={chartColors.line} stopOpacity={0} />
              </linearGradient>
              <filter id={`${id}-glow`} x="-10%" y="-60%" width="120%" height="220%">
                <feGaussianBlur stdDeviation="3.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            <CartesianGrid vertical={false} stroke={chartColors.grid} />
            <XAxis
              dataKey="t"
              type="number"
              domain={[0, duration]}
              ticks={ticks}
              interval={0}
              tickFormatter={formatTimestamp}
              axisLine={false}
              tickLine={false}
              tickMargin={10}
              height={30}
              tick={{ fill: chartColors.axis, fontSize: 11, fontFamily: MONO }}
            />
            <YAxis hide domain={[0, 100]} />
            <Tooltip
              cursor={{ stroke: "rgba(242,244,248,0.28)", strokeWidth: 1 }}
              isAnimationActive={false}
              content={(props) => <RiskTooltip {...props} risks={risks} duration={duration} />}
            />

            <Area
              dataKey="risk"
              type="monotone"
              stroke="none"
              fill={`url(#${id}-fill)`}
              activeDot={false}
              isAnimationActive={animate}
              animationDuration={drawDuration}
              animationEasing="ease-out"
            />
            <Line
              dataKey="risk"
              type="monotone"
              stroke={chartColors.line}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              dot={false}
              activeDot={{ r: 4, fill: chartColors.line, stroke: chartColors.surface, strokeWidth: 2 }}
              filter={`url(#${id}-glow)`}
              isAnimationActive={animate}
              animationDuration={drawDuration}
              animationEasing="ease-out"
            />

            <RiskMarkers
              risks={risks}
              duration={duration}
              delay={animate ? (drawDuration / 1000) * 0.75 : 0}
            />
          </ComposedChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

type Box = { x: number; y: number; w: number; h: number };

const overlaps = (a: Box, b: Box) =>
  a.x < b.x + b.w + 4 && b.x < a.x + a.w + 4 && a.y < b.y + b.h + 2 && b.y < a.y + a.h + 2;

/**
 * Severity-colored markers with two-line labels (timestamp + reason).
 * Labels sit above the dot, flip below on collision, and are dropped if
 * neither fits; the tooltip and the screen-reader list still carry them.
 */
function RiskMarkers({
  risks,
  duration,
  delay,
}: {
  risks: DropOffRisk[];
  duration: number;
  delay: number;
}) {
  const xScale = useXAxisScale();
  const yScale = useYAxisScale();
  const plot = usePlotArea();
  if (!xScale || !yScale || !plot) return null;

  const fontSize = plot.width < 420 ? 10 : 11;
  const charW = fontSize * 0.6;
  const lineH = fontSize + 4;
  const placed: Box[] = [];

  const sorted = [...risks]
    .filter((r) => r.timestamp >= 0 && r.timestamp <= duration)
    .sort((a, b) => a.timestamp - b.timestamp);

  return (
    <g>
      {sorted.map((risk, i) => {
        const cx = Number(xScale(risk.timestamp));
        const cy = Number(yScale(riskAt(risk.timestamp, risks, duration)));
        const color = severityColor[risk.severity];
        const reason = risk.reason.length > 22 ? `${risk.reason.slice(0, 21)}…` : risk.reason;
        const w = Math.max(reason.length, 5) * charW + 20;
        const h = lineH * 2 + 8;
        const x = Math.min(Math.max(cx - w / 2, plot.x), plot.x + plot.width - w);

        const above: Box = { x, y: cy - 14 - h, w, h };
        const below: Box = { x, y: cy + 14, w, h };
        const fits = (b: Box) =>
          b.y >= 0 && b.y + b.h <= plot.y + plot.height && !placed.some((p) => overlaps(p, b));
        const box = fits(above) ? above : fits(below) ? below : null;
        if (box) placed.push(box);

        return (
          <motion.g
            key={`${risk.timestamp}-${i}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: delay + i * 0.18, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          >
            <line
              x1={cx}
              x2={cx}
              y1={cy + 6}
              y2={plot.y + plot.height}
              stroke={color}
              strokeOpacity={0.3}
              strokeWidth={1}
            />
            <circle cx={cx} cy={cy} r={11} fill={color} fillOpacity={0.16} />
            <circle cx={cx} cy={cy} r={5} fill={color} stroke={chartColors.surface} strokeWidth={2} />
            {box && (
              <g>
                <rect
                  x={box.x}
                  y={box.y}
                  width={box.w}
                  height={box.h}
                  rx={7}
                  fill={chartColors.raised}
                  stroke={color}
                  strokeOpacity={0.45}
                />
                <circle cx={box.x + 10} cy={box.y + 4 + lineH / 2} r={2.5} fill={color} />
                <text
                  x={box.x + 17}
                  y={box.y + 4 + lineH / 2}
                  dominantBaseline="central"
                  fill={chartColors.axis}
                  style={{ fontFamily: MONO, fontSize }}
                >
                  {formatTimestamp(risk.timestamp)}
                </text>
                <text
                  x={box.x + 10}
                  y={box.y + 4 + lineH * 1.5}
                  dominantBaseline="central"
                  fill={chartColors.text}
                  style={{ fontFamily: MONO, fontSize, fontWeight: 500 }}
                >
                  {reason}
                </text>
              </g>
            )}
          </motion.g>
        );
      })}
    </g>
  );
}

function RiskTooltip({
  active,
  payload,
  risks,
  duration,
}: TooltipContentProps & { risks: DropOffRisk[]; duration: number }) {
  if (!active || !payload?.length) return null;
  const point = payload[0]?.payload as { t: number; risk: number } | undefined;
  if (!point) return null;

  const near = Math.max(duration * 0.04, 0.75);
  const nearby = risks.find((r) => Math.abs(r.timestamp - point.t) <= near);

  return (
    <div className="rounded-lg border border-border bg-surface-raised px-3 py-2 shadow-xl">
      <p className="text-sm font-semibold text-foreground">{Math.round(point.risk)}% risk</p>
      <p className="font-mono text-[11px] text-muted-foreground">at {formatTimestamp(point.t)}</p>
      {nearby && (
        <p className="mt-1.5 flex items-center gap-1.5 text-xs text-foreground">
          <span
            className="inline-block h-0.5 w-3 rounded-full"
            style={{ backgroundColor: severityColor[nearby.severity] }}
          />
          {nearby.reason}
        </p>
      )}
    </div>
  );
}
