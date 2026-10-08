"use client";

import { useRef, useState } from "react";
import { CloudUpload } from "lucide-react";

import { cn } from "@/lib/utils";

export function Dropzone({
  onFile,
  error,
  disabled,
}: {
  onFile: (file: File) => void;
  error?: string | null;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const file = e.dataTransfer.files?.[0];
          if (file && !disabled) onFile(file);
        }}
        className={cn(
          "relative flex aspect-[4/5] w-full flex-col items-center justify-center rounded-2xl border border-dashed px-6 text-center transition-colors sm:aspect-[9/12]",
          dragging ? "border-lime bg-lime/[0.06]" : "border-[#2a3247] bg-card",
          error && !dragging && "border-danger/50",
        )}
      >
        <div aria-hidden="true" className="bg-dot-grid pointer-events-none absolute inset-0 rounded-2xl opacity-60" />
        <span className="relative inline-flex size-14 items-center justify-center rounded-2xl bg-icon-tile text-lime">
          <CloudUpload className="size-6" aria-hidden="true" />
        </span>
        <p className="relative mt-5 text-base font-semibold">Drop your video here</p>
        <p className="relative mt-1.5 text-sm text-muted-foreground">MP4 or MOV · up to 3 minutes · 200 MB max</p>
        <button
          type="button"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
          className="relative mt-6 inline-flex h-10 cursor-pointer items-center rounded-xl border border-border-green px-4 text-sm font-semibold transition-colors hover:border-lime/45 focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:outline-none disabled:opacity-50"
        >
          Choose a file
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="video/mp4,video/quicktime,.mp4,.mov"
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onFile(file);
            e.target.value = "";
          }}
        />
      </div>
      {error && (
        <p role="alert" className="mt-3 text-sm text-[#fca5a5]">
          {error}
        </p>
      )}
    </div>
  );
}
