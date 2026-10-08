import { z } from "zod";

export const MAX_VIDEO_BYTES = 200 * 1024 * 1024;
export const MAX_VIDEO_SECONDS = 180;
export const ACCEPTED_VIDEO_TYPES = ["video/mp4", "video/quicktime"] as const;

const count = z.number().int().min(0).max(1e12);

export const performanceSchema = z
  .object({
    views: count.optional(),
    avgWatchPercent: z.number().min(0).max(100).optional(),
    likes: count.optional(),
    shares: count.optional(),
  })
  .strict();

export type PerformanceData = z.infer<typeof performanceSchema>;

export const createAnalysisSchema = z.object({
  platform: z.enum(["tiktok", "reels", "shorts"]),
  duration: z.number().positive().max(MAX_VIDEO_SECONDS + 1),
  mimeType: z.enum(ACCEPTED_VIDEO_TYPES),
  fileName: z.string().max(200).optional(),
  caption: z.string().trim().max(2200).optional(),
  niche: z.string().trim().max(80).optional(),
  goal: z.string().trim().max(120).optional(),
  performance: performanceSchema.optional(),
});

export type CreateAnalysisInput = z.infer<typeof createAnalysisSchema>;

export type AnalysisMetadata = {
  caption?: string;
  niche?: string;
  goal?: string;
  fileName?: string;
};

export const audioStatusSchema = z.enum(["ok", "no_audio", "silent", "unsupported"]);
export type AudioStatus = z.infer<typeof audioStatusSchema>;

export type TranscriptSegment = { start: number; end: number; text: string };

/** What /api/transcribe stores on the analysis row. */
export type StoredTranscript =
  | { status: "ok"; text: string; language?: string; segments: TranscriptSegment[] }
  | { status: "no_audio" | "silent" | "unsupported" | "failed"; error?: string };

export const GOALS = [
  "Grow followers",
  "Get more views",
  "Drive sales or leads",
  "Boost engagement",
  "Build community",
] as const;
