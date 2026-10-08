"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, ChevronDown, Coins, RotateCcw, TriangleAlert } from "lucide-react";

import { Dropzone } from "@/components/upload/dropzone";
import { ProgressSteps, type StepId, type StepState } from "@/components/upload/progress-steps";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  ACCEPTED_VIDEO_TYPES,
  GOALS,
  MAX_VIDEO_BYTES,
  MAX_VIDEO_SECONDS,
  type AudioStatus,
  type PerformanceData,
} from "@/lib/analysis/inputs";
import type { Platform } from "@/lib/database.types";
import { PLATFORMS } from "@/lib/platforms";
import { VIDEO_BUCKET } from "@/lib/storage";
import { createClient } from "@/lib/supabase/client";
import { cn, formatBytes, formatTimestamp } from "@/lib/utils";
import { extractAudio } from "@/lib/video/audio";
import { extractFrames, readVideoInfo, type VideoInfo } from "@/lib/video/frames";
import { runPool, uploadToStorage } from "@/lib/video/upload";

type Created = { id: string; folder: string; videoPath: string; thumbnailPath: string };
type Job = { id: string; frames: { t: number; path: string }[] };
type RunError = { step: StepId; message: string; code?: string; canRetryAnalysis?: boolean };

class StepError extends Error {
  constructor(
    public step: StepId,
    message: string,
    public code?: string,
  ) {
    super(message);
  }
}

const freshSteps = (): Record<StepId, StepState> => ({
  upload: { status: "pending" },
  frames: { status: "pending" },
  transcribe: { status: "pending" },
  analyze: { status: "pending" },
  done: { status: "pending" },
});

const SKIP_REASON: Record<Exclude<AudioStatus, "ok"> | "failed", string> = {
  no_audio: "No audio track found.",
  silent: "The audio is silent.",
  unsupported: "This browser can't read the audio.",
  failed: "Transcription failed.",
};

const ERROR_TITLE: Record<StepId, string> = {
  upload: "Upload failed",
  frames: "Couldn't read frames from this video",
  transcribe: "Transcription step failed",
  analyze: "Analysis failed",
  done: "Something went wrong",
};

function mimeTypeOf(file: File) {
  if ((ACCEPTED_VIDEO_TYPES as readonly string[]).includes(file.type))
    return file.type as (typeof ACCEPTED_VIDEO_TYPES)[number];
  if (/\.mov$/i.test(file.name)) return "video/quicktime";
  if (/\.mp4$/i.test(file.name)) return "video/mp4";
  return null;
}

async function postJson(url: string, body: unknown) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  return { ok: res.ok, status: res.status, data };
}

export function UploadFlow({ credits }: { credits: number }) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [info, setInfo] = useState<VideoInfo | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [platform, setPlatform] = useState<Platform>("tiktok");
  const [running, setRunning] = useState(false);
  const [steps, setSteps] = useState(freshSteps);
  const [runError, setRunError] = useState<RunError | null>(null);
  const job = useRef<Job | null>(null);

  const outOfCredits = credits < 1;

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  useEffect(() => {
    if (!running || runError) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [running, runError]);

  const update = (id: StepId, patch: Partial<StepState>) =>
    setSteps((s) => ({ ...s, [id]: { ...s[id], ...patch } }));

  async function handleFile(next: File) {
    setFileError(null);
    if (!mimeTypeOf(next)) {
      setFileError("That file type isn't supported. Upload an MP4 or MOV video.");
      return;
    }
    if (next.size > MAX_VIDEO_BYTES) {
      setFileError(`This file is ${formatBytes(next.size)}. The limit is 200 MB.`);
      return;
    }
    setChecking(true);
    try {
      const meta = await readVideoInfo(next);
      if (meta.duration > MAX_VIDEO_SECONDS + 0.5) {
        setFileError(
          `This video is ${formatTimestamp(meta.duration)} long. ViewScale analyzes videos up to 3:00.`,
        );
        return;
      }
      setFile(next);
      setInfo(meta);
      setPreviewUrl(URL.createObjectURL(next));
    } catch {
      setFileError("Your browser can't read this video. Export it as an H.264 MP4 and try again.");
    } finally {
      setChecking(false);
    }
  }

  function clearFile() {
    setFile(null);
    setInfo(null);
    setPreviewUrl(null);
  }

  async function analyze() {
    const current = job.current;
    if (!current) return;
    setRunError(null);
    update("analyze", { status: "active", detail: "Claude is reviewing frames and transcript…" });
    const started = Date.now();
    const timer = window.setInterval(() => {
      const elapsed = formatTimestamp((Date.now() - started) / 1000);
      update("analyze", {
        detail: `Claude is reviewing ${current.frames.length} frames and the transcript · ${elapsed}`,
      });
    }, 1000);

    try {
      const res = await postJson("/api/analyze", {
        analysisId: current.id,
        frames: current.frames,
      });
      if (!res.ok) {
        throw new StepError(
          "analyze",
          String(res.data.error ?? "The analysis didn't complete."),
          res.data.code as string | undefined,
        );
      }
      update("analyze", { status: "done", detail: "Diagnosis ready" });
      update("done", { status: "done", detail: "Opening your report…" });
      router.push(`/analysis/${current.id}`);
    } catch (err) {
      const e =
        err instanceof StepError ? err : new StepError("analyze", "Network error during analysis.");
      update("analyze", { status: "error", detail: e.message });
      setRunError({
        step: "analyze",
        message: e.message,
        code: e.code,
        canRetryAnalysis: e.code !== "insufficient_credits",
      });
    } finally {
      window.clearInterval(timer);
    }
  }

  async function start(form: FormData) {
    if (!file || !info || running) return;
    const mimeType = mimeTypeOf(file)!;
    const text = (name: string) => String(form.get(name) ?? "").trim() || undefined;
    const num = (name: string) => {
      const raw = String(form.get(name) ?? "").replace(/[,\s%]/g, "");
      if (!raw) return undefined;
      const n = Number(raw);
      return Number.isFinite(n) && n >= 0 ? n : undefined;
    };
    const performance: PerformanceData = {};
    const views = num("views");
    const avgWatchPercent = num("avgWatchPercent");
    const likes = num("likes");
    const shares = num("shares");
    if (views !== undefined) performance.views = Math.round(views);
    if (avgWatchPercent !== undefined) performance.avgWatchPercent = Math.min(100, avgWatchPercent);
    if (likes !== undefined) performance.likes = Math.round(likes);
    if (shares !== undefined) performance.shares = Math.round(shares);

    setRunning(true);
    setRunError(null);
    setSteps(freshSteps());
    job.current = null;

    const supabase = createClient();
    let created: Created | null = null;
    const uploaded: string[] = [];

    try {
      const { data: auth } = await supabase.auth.getSession();
      const token = auth.session?.access_token;
      if (!token) throw new StepError("upload", "Your session expired. Sign in again to continue.");

      update("upload", { status: "active", detail: "Preparing…", progress: 0 });
      const res = await postJson("/api/analyses", {
        platform,
        duration: info.duration,
        mimeType,
        fileName: file.name.slice(0, 200),
        caption: text("caption"),
        niche: text("niche"),
        goal: text("goal"),
        performance: Object.keys(performance).length ? performance : undefined,
      });
      if (!res.ok) {
        throw new StepError(
          "upload",
          String(res.data.error ?? "Couldn't start the analysis."),
          res.data.code as string | undefined,
        );
      }
      const c = res.data as unknown as Created;
      created = c;

      const put = async (
        path: string,
        body: Blob,
        contentType: string,
        onProgress?: (l: number, t: number) => void,
      ) => {
        await uploadToStorage({ path, body, contentType, accessToken: token, onProgress });
        uploaded.push(path);
      };

      const uploadVideo = async () => {
        try {
          await put(c.videoPath, file, mimeType, (loaded, total) =>
            update("upload", {
              progress: (loaded / total) * 100,
              detail: `${formatBytes(loaded)} of ${formatBytes(total)}`,
            }),
          );
        } catch (err) {
          throw new StepError("upload", err instanceof Error ? err.message : "Upload failed.");
        }
        update("upload", {
          status: "done",
          progress: 100,
          detail: `${formatBytes(file.size)} uploaded`,
        });
      };

      const prepareMedia = async () => {
        update("frames", { status: "active", progress: 0, detail: "Reading video…" });
        let frames;
        try {
          frames = await extractFrames(file, info.duration, (done, total) =>
            update("frames", {
              progress: (done / total) * 80,
              detail: `${done} of ${total} frames`,
            }),
          );
        } catch (err) {
          throw new StepError(
            "frames",
            `${err instanceof Error ? err.message : "Frame extraction failed"}. Try exporting the video as an H.264 MP4.`,
          );
        }

        const framePaths = frames.map((f, i) => ({
          t: f.t,
          path: `${c.folder}/frames/${String(i).padStart(2, "0")}.jpg`,
        }));
        let sent = 0;
        try {
          await runPool(frames, 6, async (frame, i) => {
            await put(framePaths[i].path, frame.blob, "image/jpeg");
            sent++;
            update("frames", { progress: 80 + (sent / frames.length) * 20 });
          });
          await put(c.thumbnailPath, frames[0].blob, "image/jpeg");
        } catch (err) {
          throw new StepError(
            "frames",
            err instanceof Error ? err.message : "Couldn't upload frames.",
          );
        }
        update("frames", {
          status: "done",
          progress: 100,
          detail: `${frames.length} frames captured`,
        });

        update("transcribe", { status: "active", detail: "Extracting audio…" });
        const audio = await extractAudio(file);
        if (audio.ok) {
          try {
            await put(`${c.folder}/audio.wav`, audio.wav, "audio/wav");
          } catch (err) {
            throw new StepError(
              "transcribe",
              err instanceof Error ? err.message : "Couldn't upload audio.",
            );
          }
        }
        return { framePaths, audioStatus: (audio.ok ? "ok" : audio.reason) as AudioStatus };
      };

      const [, media] = await Promise.all([uploadVideo(), prepareMedia()]);

      update("transcribe", {
        status: "active",
        detail:
          media.audioStatus === "ok" ? "Whisper is transcribing the audio…" : "Checking audio…",
      });
      const tr = await postJson("/api/transcribe", { analysisId: c.id, audio: media.audioStatus });
      if (!tr.ok)
        throw new StepError("transcribe", String(tr.data.error ?? "Transcription step failed."));
      if (tr.data.status === "ok") {
        update("transcribe", {
          status: "done",
          detail: `Transcript ready · ${tr.data.segments} segments`,
        });
      } else {
        const reason = SKIP_REASON[tr.data.status as keyof typeof SKIP_REASON] ?? "No transcript.";
        update("transcribe", {
          status: "skipped",
          detail: `${reason} Continuing with frames only.`,
        });
      }

      job.current = { id: c.id, frames: media.framePaths };
    } catch (err) {
      const e =
        err instanceof StepError
          ? err
          : new StepError("upload", "Something went wrong. Try again.");
      update(e.step, { status: "error", detail: e.message });
      setRunError({ step: e.step, message: e.message, code: e.code });
      // Nothing was charged yet: remove the half-made analysis so it doesn't linger.
      if (created) {
        if (uploaded.length) await supabase.storage.from(VIDEO_BUCKET).remove(uploaded);
        await supabase.from("analyses").delete().eq("id", created.id);
      }
      return;
    }

    await analyze();
  }

  function reset() {
    setRunning(false);
    setRunError(null);
    setSteps(freshSteps());
    job.current = null;
  }

  return (
    <>
      {running && (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,320px)_1fr] lg:gap-10">
          <VideoPreview url={previewUrl} info={info} file={file} />
          <div className="space-y-5">
            <ProgressSteps steps={steps} />
            {runError && (
              <div
                role="alert"
                className="rounded-2xl border border-danger/35 bg-danger/[0.06] p-5"
              >
                <p className="flex items-center gap-2 font-semibold text-foreground">
                  <TriangleAlert className="size-4 text-danger" aria-hidden="true" />
                  {ERROR_TITLE[runError.step]}
                </p>
                <p className="mt-1.5 text-sm text-muted-foreground">{runError.message}</p>
                <div className="mt-4 flex flex-wrap gap-2.5">
                  {runError.canRetryAnalysis ? (
                    <Button onClick={() => void analyze()}>
                      <RotateCcw className="size-4" aria-hidden="true" />
                      Retry analysis
                    </Button>
                  ) : (
                    <Button onClick={reset}>
                      <RotateCcw className="size-4" aria-hidden="true" />
                      Try again
                    </Button>
                  )}
                  {runError.code === "insufficient_credits" ? (
                    <Button asChild variant="secondary">
                      <Link href="/pricing">See plans</Link>
                    </Button>
                  ) : (
                    <Button asChild variant="secondary">
                      <Link href="/dashboard">Back to dashboard</Link>
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Kept mounted while running so "Try again" keeps what was typed. */}
      <form
        hidden={running}
        onSubmit={(e) => {
          e.preventDefault();
          void start(new FormData(e.currentTarget));
        }}
        className="grid gap-6 lg:grid-cols-[minmax(0,320px)_1fr] lg:gap-10"
      >
        <div>
          {file && info ? (
            <div className="space-y-3">
              <VideoPreview url={previewUrl} info={info} file={file} />
              <Button type="button" variant="secondary" className="w-full" onClick={clearFile}>
                Choose a different video
              </Button>
            </div>
          ) : (
            <Dropzone onFile={(f) => void handleFile(f)} error={fileError} disabled={checking} />
          )}
        </div>

        <div className="space-y-7">
          {outOfCredits && (
            <div className="flex flex-col gap-3 rounded-2xl border border-warning/30 bg-warning/[0.06] p-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="flex items-center gap-2 text-sm text-foreground">
                <Coins className="size-4 text-warning" aria-hidden="true" />
                You&apos;re out of credits. Upgrade to keep analyzing.
              </p>
              <Button asChild size="sm">
                <Link href="/pricing">See plans</Link>
              </Button>
            </div>
          )}

          <fieldset>
            <legend className="text-sm font-medium">Platform</legend>
            <div className="mt-3 grid grid-cols-3 gap-2 rounded-2xl border border-border bg-card p-1.5">
              {PLATFORMS.map((p) => (
                <label key={p.id} className="relative">
                  <input
                    type="radio"
                    name="platform"
                    value={p.id}
                    checked={platform === p.id}
                    onChange={() => setPlatform(p.id)}
                    className="peer sr-only"
                  />
                  <span className="flex h-11 cursor-pointer items-center justify-center rounded-xl text-sm font-semibold text-muted-foreground transition-colors peer-checked:bg-lime peer-checked:text-primary-foreground peer-focus-visible:ring-2 peer-focus-visible:ring-ring/70 hover:text-foreground peer-checked:hover:text-primary-foreground">
                    {p.label}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <Section
            title="Context"
            hint="Optional. Helps judge the hook, CTA and platform fit."
            defaultOpen
          >
            <div className="space-y-2">
              <Label htmlFor="caption">Caption</Label>
              <Textarea
                id="caption"
                name="caption"
                maxLength={2200}
                placeholder="The caption you posted or plan to post"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="niche">Niche</Label>
                <Input
                  id="niche"
                  name="niche"
                  maxLength={80}
                  placeholder="e.g. home cooking, fitness, SaaS"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="goal">Goal</Label>
                <select
                  id="goal"
                  name="goal"
                  defaultValue=""
                  className="flex h-11 w-full cursor-pointer appearance-none rounded-xl border border-border bg-background bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2216%22 height=%2216%22 fill=%22none%22 stroke=%22%238A93A6%22 stroke-width=%222%22 viewBox=%220 0 24 24%22><path d=%22m6 9 6 6 6-6%22/></svg>')] bg-[length:16px] bg-[right_12px_center] bg-no-repeat px-3.5 pr-10 text-[15px] text-foreground outline-none focus-visible:border-lime/50 focus-visible:ring-3 focus-visible:ring-lime/15 sm:text-sm"
                >
                  <option value="">Not specified</option>
                  {GOALS.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </Section>

          <Section
            title="Real performance data"
            hint="Optional. If the video is already live, add its numbers. They're shown as real data, separate from estimates."
          >
            <div className="grid grid-cols-2 gap-4">
              <NumberField name="views" label="Views" placeholder="12,400" />
              <NumberField
                name="avgWatchPercent"
                label="Avg. watch %"
                placeholder="38"
                suffix="%"
              />
              <NumberField name="likes" label="Likes" placeholder="840" />
              <NumberField name="shares" label="Shares" placeholder="57" />
            </div>
          </Section>

          <div className="space-y-3 border-t border-border pt-6">
            <Button
              type="submit"
              size="lg"
              className="w-full sm:w-auto"
              disabled={!file || outOfCredits}
            >
              Analyze video
              <ArrowRight className="size-4" aria-hidden="true" />
            </Button>
            <p className="text-xs text-muted-foreground">
              Uses 1 credit when the analysis starts. If it fails, the credit goes back to you.
              {!file && " Add a video to continue."}
            </p>
          </div>
        </div>
      </form>
    </>
  );
}

function VideoPreview({
  url,
  info,
  file,
}: {
  url: string | null;
  info: VideoInfo | null;
  file: File | null;
}) {
  return (
    <div className="surface-card overflow-hidden">
      <div className="flex aspect-[9/12] items-center justify-center bg-black">
        {url && (
          <video
            src={url}
            controls
            muted
            playsInline
            preload="metadata"
            className="size-full object-contain"
          />
        )}
      </div>
      {file && info && (
        <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-3">
          <p className="min-w-0 truncate text-sm font-medium">{file.name}</p>
          <p className="shrink-0 font-mono text-xs text-muted-foreground">
            {formatTimestamp(info.duration)} · {formatBytes(file.size)}
          </p>
        </div>
      )}
    </div>
  );
}

function Section({
  title,
  hint,
  defaultOpen = false,
  children,
}: {
  title: string;
  hint: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  return (
    <details open={defaultOpen} className="group rounded-2xl border border-border bg-card">
      <summary className="flex cursor-pointer list-none items-start justify-between gap-4 rounded-2xl p-5 focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:outline-none [&::-webkit-details-marker]:hidden">
        <span>
          <span className="block text-sm font-semibold">{title}</span>
          <span className="mt-1 block text-xs text-muted-foreground">{hint}</span>
        </span>
        <ChevronDown
          className="mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
          aria-hidden="true"
        />
      </summary>
      <div className="space-y-4 px-5 pb-5">{children}</div>
    </details>
  );
}

function NumberField({
  name,
  label,
  placeholder,
  suffix,
}: {
  name: string;
  label: string;
  placeholder: string;
  suffix?: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <div className="relative">
        <Input
          id={name}
          name={name}
          inputMode="decimal"
          autoComplete="off"
          placeholder={placeholder}
          className={cn(suffix && "pr-8")}
        />
        {suffix && (
          <span className="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 text-sm text-muted-foreground">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}
