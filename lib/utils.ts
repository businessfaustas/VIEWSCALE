import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
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
