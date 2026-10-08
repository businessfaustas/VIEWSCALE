import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** "0:03" when on a whole second, "0:01.5" otherwise. For pointing at a moment. */
export function formatMoment(seconds: number) {
  const tenths = Math.round(Math.max(0, seconds) * 10) / 10;
  if (Number.isInteger(tenths)) return formatTimestamp(tenths);
  const whole = Math.floor(tenths);
  return `${formatTimestamp(whole)}.${Math.round((tenths - whole) * 10)}`;
}

/** Formats seconds as m:ss, e.g. 3 -> "0:03", 72.4 -> "1:12". */
export function formatTimestamp(seconds: number) {
  const s = Math.max(0, Math.floor(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export type ScoreTone = "good" | "mid" | "low";

/** Maps a 0-100 score to the status color scale: lime / orange / red. */
export function scoreTone(score: number): ScoreTone {
  if (score >= 70) return "good";
  if (score >= 45) return "mid";
  return "low";
}

export const toneColor: Record<ScoreTone, string> = {
  good: "var(--lime)",
  mid: "var(--warning)",
  low: "var(--danger)",
};

export const toneText: Record<ScoreTone, string> = {
  good: "text-lime",
  mid: "text-warning",
  low: "text-danger",
};

const dateFormat = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" });

/** "Oct 8, 2026" */
export function formatDate(iso: string) {
  return dateFormat.format(new Date(iso));
}

/** 1536 -> "1.5 KB", 52_428_800 -> "50 MB" */
export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit++;
  }
  return `${value >= 10 ? Math.round(value) : value.toFixed(1)} ${units[unit]}`;
}
