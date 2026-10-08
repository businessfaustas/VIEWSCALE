"use client";

import { useRouter } from "next/navigation";

import { Label } from "@/components/ui/label";

export type CompareOption = { id: string; label: string };

const selectClass =
  "flex h-11 w-full cursor-pointer appearance-none rounded-xl border border-border bg-card bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2216%22 height=%2216%22 fill=%22none%22 stroke=%22%238A93A6%22 stroke-width=%222%22 viewBox=%220 0 24 24%22><path d=%22m6 9 6 6 6-6%22/></svg>')] bg-[length:16px] bg-[right_12px_center] bg-no-repeat px-3.5 pr-10 text-sm text-foreground outline-none focus-visible:border-lime/50 focus-visible:ring-3 focus-visible:ring-lime/15";

/** Two selects that write ?a=&b= to the URL. */
export function ComparePicker({ options, a, b }: { options: CompareOption[]; a: string; b: string }) {
  const router = useRouter();
  const set = (key: "a" | "b", value: string) => {
    const params = new URLSearchParams({ a, b });
    params.set(key, value);
    router.replace(`/compare?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {(["a", "b"] as const).map((key) => (
        <div key={key} className="space-y-2">
          <Label htmlFor={`compare-${key}`}>Video {key.toUpperCase()}</Label>
          <select
            id={`compare-${key}`}
            value={key === "a" ? a : b}
            onChange={(e) => set(key, e.target.value)}
            className={selectClass}
          >
            {options.map((o) => (
              <option key={o.id} value={o.id} disabled={o.id === (key === "a" ? b : a)}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      ))}
    </div>
  );
}
