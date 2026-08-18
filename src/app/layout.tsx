import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";
import { fontVariables } from "../lib/fonts";
import SiteNav from "../components/SiteNav";
import MotionProvider from "../components/MotionProvider";
import StoreFooter from "../components/StoreFooter";
import Toaster from "../components/Toaster";

export const metadata: Metadata = {
  title: "CoverCraft — Mobile Back Covers",
  description: "Custom mobile back covers, designs & templates",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={fontVariables}>
      <body>
        <MotionProvider>
          {/* Skip link: visually hidden until focused, then the first Tab stop —
              lets keyboard/screen-reader users jump past the nav to page content. */}
          <a
            href="#main-content"
            className="sr-only rounded-lg bg-accent-600 px-4 py-2 text-sm font-bold text-white shadow-glow focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100]"
          >
            Skip to content
          </a>
          <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/95 px-4 py-3 text-white shadow-lg backdrop-blur sm:px-6">
            <div className="mx-auto flex max-w-7xl items-center justify-between gap-4"><Link href="/" className="flex items-center gap-2 font-black tracking-tight text-lg sm:text-xl"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-600 text-sm">C</span>CoverCraft</Link>
            <SiteNav /></div>
          </header>
          <main id="main-content" tabIndex={-1} className="focus:outline-none">{children}</main>
          <StoreFooter />
          <Toaster />
        </MotionProvider>
      </body>
    </html>
  );
}
