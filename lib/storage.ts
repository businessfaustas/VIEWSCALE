/** Private Storage bucket holding every upload. See supabase/migrations for policies. */
export const VIDEO_BUCKET = "videos";

/** Folder layout: {userId}/{analysisId}/... (the first segment is what RLS checks). */
export function analysisFolder(userId: string, analysisId: string) {
  return `${userId}/${analysisId}`;
}

export function videoExtension(mimeType: string) {
  return mimeType === "video/quicktime" ? "mov" : "mp4";
}
