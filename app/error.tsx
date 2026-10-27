"use client";

import { ErrorState } from "@/components/site/error-state";
import { Footer } from "@/components/site/footer";
import { Navbar } from "@/components/site/navbar";

/** Catches server and render errors on public pages (and anything not caught lower down). */
export default function Error({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        <ErrorState error={error} retry={retry} />
      </main>
      <Footer />
    </>
  );
}
