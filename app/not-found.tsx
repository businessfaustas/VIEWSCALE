import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Footer } from "@/components/site/footer";
import { Navbar } from "@/components/site/navbar";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <>
      <Navbar />
      <main className="flex flex-1 items-center justify-center px-4 py-24">
        <div className="surface-card w-full max-w-md p-8 text-center">
          <p className="label-mono text-lime">404</p>
          <h1 className="mt-3 text-2xl tracking-tight">Nothing to analyze here.</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This page doesn&apos;t exist yet, or it moved.
          </p>
          <Button asChild variant="secondary" className="mt-6">
            <Link href="/">
              <ArrowLeft className="size-4" aria-hidden="true" />
              Back home
            </Link>
          </Button>
        </div>
      </main>
      <Footer />
    </>
  );
}
