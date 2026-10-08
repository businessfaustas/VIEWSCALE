/**
 * Browser-side frame extraction with a hidden <video> + <canvas>.
 * No server ffmpeg needed.
 */

export const MAX_FRAMES = 40;
export const FRAME_WIDTH = 512;

export type ExtractedFrame = { t: number; blob: Blob };

/**
 * Every 0.5s for the first 3s (the hook), then every 1.5s. When that would
 * exceed MAX_FRAMES, the spacing after 3s widens so the whole video is still
 * covered. The first frame (t = 0) is always included.
 */
export function frameTimestamps(duration: number, max = MAX_FRAMES): number[] {
  const end = Math.max(0, duration - 0.1);
  const times: number[] = [0];
  for (let t = 0.5; t < 3 && t <= end && times.length < max; t += 0.5) times.push(t);

  if (end >= 3 && times.length < max) {
    const slots = max - times.length;
    const span = end - 3;
    const step = slots > 1 ? Math.max(1.5, span / (slots - 1)) : Math.max(1.5, span);
    for (let t = 3; t <= end + 1e-6 && times.length < max; t += step) {
      times.push(Math.round(t * 100) / 100);
    }
  }
  // Make sure the ending (where CTAs live) is in the set.
  const last = times[times.length - 1];
  if (times.length < max && end - last > 0.75) times.push(Math.round(end * 100) / 100);
  return times;
}

export type VideoInfo = { duration: number; width: number; height: number };

/** Loads metadata for a local file. Rejects if the browser can't decode it. */
export function readVideoInfo(file: File): Promise<VideoInfo> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    const done = () => URL.revokeObjectURL(url);
    video.onloadedmetadata = () => {
      const info = { duration: video.duration, width: video.videoWidth, height: video.videoHeight };
      done();
      if (!Number.isFinite(info.duration) || !info.width) reject(new Error("unreadable"));
      else resolve(info);
    };
    video.onerror = () => {
      done();
      reject(new Error("unreadable"));
    };
    video.src = url;
  });
}

function once(target: HTMLVideoElement, event: string, timeoutMs: number) {
  return new Promise<void>((resolve, reject) => {
    const timer = window.setTimeout(() => {
      cleanup();
      reject(new Error(`Timed out waiting for ${event}`));
    }, timeoutMs);
    const onEvent = () => {
      cleanup();
      resolve();
    };
    const onError = () => {
      cleanup();
      reject(new Error("The video couldn't be decoded"));
    };
    const cleanup = () => {
      window.clearTimeout(timer);
      target.removeEventListener(event, onEvent);
      target.removeEventListener("error", onError);
    };
    target.addEventListener(event, onEvent);
    target.addEventListener("error", onError);
  });
}

async function seek(video: HTMLVideoElement, t: number) {
  if (Math.abs(video.currentTime - t) < 0.001 && video.readyState >= 2) return;
  const seeked = once(video, "seeked", 10_000);
  video.currentTime = t;
  await seeked;
  // Give the decoder a frame to paint before drawing.
  await new Promise((r) => requestAnimationFrame(() => r(null)));
}

export async function extractFrames(
  file: File,
  duration: number,
  onProgress?: (done: number, total: number) => void,
): Promise<ExtractedFrame[]> {
  const times = frameTimestamps(duration);
  const url = URL.createObjectURL(file);
  const video = document.createElement("video");
  video.muted = true;
  video.playsInline = true;
  video.preload = "auto";
  video.crossOrigin = "anonymous";

  try {
    const loaded = once(video, "loadeddata", 20_000);
    video.src = url;
    video.load();
    await loaded;

    const width = FRAME_WIDTH;
    const height = Math.round((FRAME_WIDTH * video.videoHeight) / video.videoWidth);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas is not available in this browser");

    const frames: ExtractedFrame[] = [];
    for (const t of times) {
      await seek(video, t);
      ctx.drawImage(video, 0, 0, width, height);
      const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.8));
      if (!blob) throw new Error("Couldn't encode a frame");
      frames.push({ t, blob });
      onProgress?.(frames.length, times.length);
    }
    return frames;
  } finally {
    video.removeAttribute("src");
    video.load();
    URL.revokeObjectURL(url);
  }
}
