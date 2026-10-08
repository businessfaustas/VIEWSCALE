import { VIDEO_BUCKET } from "@/lib/storage";

/**
 * Uploads a file straight to Supabase Storage with upload progress.
 * supabase-js doesn't report progress, so this calls the same REST endpoint
 * with XMLHttpRequest. RLS on storage.objects still applies (the user's JWT).
 */
export function uploadToStorage({
  path,
  body,
  contentType,
  accessToken,
  onProgress,
}: {
  path: string;
  body: Blob;
  contentType: string;
  accessToken: string;
  onProgress?: (loaded: number, total: number) => void;
}) {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL!.replace(/\/$/, "");
  const url = `${base}/storage/v1/object/${VIDEO_BUCKET}/${path.split("/").map(encodeURIComponent).join("/")}`;

  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.setRequestHeader("Authorization", `Bearer ${accessToken}`);
    xhr.setRequestHeader("apikey", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
    xhr.setRequestHeader("Content-Type", contentType);
    xhr.setRequestHeader("x-upsert", "true");
    xhr.setRequestHeader("cache-control", "max-age=3600");

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress?.(e.loaded, e.total);
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) return resolve();
      let message = `Upload failed (${xhr.status})`;
      try {
        const parsed = JSON.parse(xhr.responseText) as { message?: string; error?: string };
        message = parsed.message || parsed.error || message;
      } catch {}
      if (xhr.status === 413 || /maximum allowed size|too large/i.test(message)) {
        message = "This file is larger than your storage allows. Supabase's Free plan caps uploads at 50 MB.";
      }
      reject(new Error(message));
    };
    xhr.onerror = () => reject(new Error("Network error while uploading. Check your connection and try again."));
    xhr.onabort = () => reject(new Error("Upload cancelled."));
    xhr.send(body);
  });
}

/** Runs async tasks with a concurrency cap. */
export async function runPool<T>(items: T[], limit: number, task: (item: T, index: number) => Promise<void>) {
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const index = next++;
      await task(items[index], index);
    }
  });
  await Promise.all(workers);
}
