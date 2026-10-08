export type RiskSeverity = "low" | "medium" | "high";

export type DropOffRisk = {
  timestamp: number;
  severity: RiskSeverity;
  reason: string;
};

export type RiskPoint = { t: number; risk: number };

/** Literal hex values: SVG presentation attributes don't reliably resolve CSS vars. */
export const chartColors = {
  line: "#B8FF3C",
  grid: "#1A2030",
  axis: "#8A93A6",
  surface: "#0A0E16",
  raised: "#0F1420",
  text: "#F2F4F8",
} as const;

export const severityColor: Record<RiskSeverity, string> = {
  high: "#EF4444",
  medium: "#F59E0B",
  low: "#B8FF3C",
};

const AMPLITUDE: Record<RiskSeverity, number> = { low: 20, medium: 36, high: 54 };

/**
 * Turns discrete drop-off risks into a smooth 0-100 "estimated risk" curve:
 * a low baseline with a bump at each risk, sized by severity. This is a
 * visualization of the content analysis, not real retention data.
 */
export function riskAt(t: number, risks: DropOffRisk[], duration: number) {
  const d = Math.max(duration, 1);
  const sigma = Math.max(d * 0.035, 0.6);
  const u = t / d;
  let risk = 16 + 4 * Math.sin(u * Math.PI * 6) + 2.5 * Math.sin(u * Math.PI * 14 + 1);
  for (const r of risks) {
    risk += AMPLITUDE[r.severity] * Math.exp(-((t - r.timestamp) ** 2) / (2 * sigma ** 2));
  }
  return Math.min(97, Math.max(3, risk));
}

export function buildRiskCurve(risks: DropOffRisk[], duration: number, samples = 80) {
  const d = Math.max(duration, 1);
  const times = new Set<number>();
  for (let i = 0; i <= samples; i++) times.add(round((d * i) / samples));
  // Sample exactly at each risk so markers sit on the drawn line.
  for (const r of risks) if (r.timestamp >= 0 && r.timestamp <= d) times.add(round(r.timestamp));

  const points: RiskPoint[] = [...times]
    .sort((a, b) => a - b)
    .map((t) => ({ t, risk: round(riskAt(t, risks, d)) }));

  let sum = 0;
  for (let i = 0; i <= samples; i++) sum += riskAt((d * i) / samples, risks, d);
  const average = Math.round(sum / (samples + 1));

  return { points, average };
}

/** Evenly spaced, human-friendly x-axis ticks (at most ~7). */
export function timeTicks(duration: number) {
  const steps = [1, 2, 5, 10, 15, 20, 30, 60];
  const step = steps.find((s) => duration / s <= 6) ?? 60;
  const ticks: number[] = [];
  for (let t = 0; t <= duration + 1e-6; t += step) ticks.push(t);
  return ticks;
}

function round(n: number) {
  return Math.round(n * 100) / 100;
}
