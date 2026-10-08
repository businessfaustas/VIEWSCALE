/** The three window-chrome dots used on framed previews. */
export function WindowDots() {
  return (
    <span className="flex items-center gap-1.5" aria-hidden="true">
      <span className="size-2.5 rounded-full bg-[#ef4444]/80" />
      <span className="size-2.5 rounded-full bg-[#f59e0b]/80" />
      <span className="size-2.5 rounded-full bg-[#b8ff3c]/80" />
    </span>
  );
}
