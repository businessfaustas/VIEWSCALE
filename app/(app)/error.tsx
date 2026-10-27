"use client";

import { ErrorState } from "@/components/site/error-state";

/** Errors inside signed-in pages keep the app navbar and footer around them. */
export default function AppError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return <ErrorState error={error} retry={retry} />;
}
