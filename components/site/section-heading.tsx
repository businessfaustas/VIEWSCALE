import { cn } from "@/lib/utils";

type SectionHeadingProps = {
  label: string;
  title: string;
  accent?: string;
  id?: string;
  className?: string;
};

/** Mono label + two-line H2 where the second line carries the lime gradient. */
export function SectionHeading({ label, title, accent, id, className }: SectionHeadingProps) {
  return (
    <div className={cn("mx-auto max-w-3xl text-center", className)}>
      <p className="label-mono text-lime">{label}</p>
      <h2
        id={id}
        className="mt-4 text-[2rem] leading-[1.08] tracking-[-0.03em] sm:text-5xl"
      >
        <span className="block text-balance">{title}</span>
        {accent && <span className="block text-balance text-gradient-lime">{accent}</span>}
      </h2>
    </div>
  );
}
