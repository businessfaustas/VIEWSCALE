import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";

import { MotionProvider } from "@/components/motion-provider";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "ViewScale — AI content diagnostics for short-form video",
    template: "%s · ViewScale",
  },
  description:
    "ViewScale analyzes your TikToks, Reels and Shorts and reveals what's blocking growth — with timestamped problems and exact fixes.",
};

export const viewport: Viewport = {
  themeColor: "#05070D",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable} h-full`}>
      <body className="flex min-h-full flex-col">
        <MotionProvider>{children}</MotionProvider>
      </body>
    </html>
  );
}
