import { Features } from "@/components/landing/features";
import { FinalCta } from "@/components/landing/final-cta";
import { Hero } from "@/components/landing/hero";
import { HowItWorks } from "@/components/landing/how-it-works";
import { LiveAnalysis } from "@/components/landing/live-analysis";
import { Footer } from "@/components/site/footer";
import { Navbar } from "@/components/site/navbar";

export default function LandingPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        <Hero />
        <LiveAnalysis />
        <Features />
        <HowItWorks />
        <FinalCta />
      </main>
      <Footer />
    </>
  );
}
