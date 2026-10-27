import { TriangleAlert } from "lucide-react";

const COPY = {
  supabase: {
    title: "Supabase isn't connected yet",
    body: "Sign-in, the dashboard and uploads need a Supabase project. Add NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY to the environment variables (.env.local locally, or Settings → Environment Variables on Vercel), then redeploy.",
  },
  database: {
    title: "Your account isn't set up in the database",
    body: "Supabase is connected, but ViewScale's tables or your profile are missing. Run the SQL files in supabase/migrations, in order, in the Supabase SQL editor (or run npx supabase db push). If you signed up before running them, create your account again.",
  },
} as const;

/** Explains a missing setup step instead of letting the page crash. */
export function SetupNotice({ kind, className }: { kind: keyof typeof COPY; className?: string }) {
  const copy = COPY[kind];
  return (
    <div
      role="status"
      className={`rounded-2xl border border-warning/30 bg-warning/[0.06] p-5 ${className ?? ""}`}
    >
      <p className="flex items-center gap-2 font-semibold text-foreground">
        <TriangleAlert className="size-4 shrink-0 text-warning" aria-hidden="true" />
        {copy.title}
      </p>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{copy.body}</p>
    </div>
  );
}
