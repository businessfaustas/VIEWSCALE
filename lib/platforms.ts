import type { Platform } from "@/lib/database.types";

export const PLATFORMS: { id: Platform; label: string; long: string }[] = [
  { id: "tiktok", label: "TikTok", long: "TikTok" },
  { id: "reels", label: "Reels", long: "Instagram Reels" },
  { id: "shorts", label: "Shorts", long: "YouTube Shorts" },
];

export function platformLabel(id: Platform) {
  return PLATFORMS.find((p) => p.id === id)?.label ?? id;
}

export function platformLong(id: Platform) {
  return PLATFORMS.find((p) => p.id === id)?.long ?? id;
}
