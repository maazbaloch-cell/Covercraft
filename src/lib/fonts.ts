/**
 * Typography system for CoverCraft (Phase 2 — cinematic redesign).
 *
 * Two self-hosted Google fonts loaded via `next/font` (build-time download,
 * zero runtime requests → CSP-safe, no layout shift):
 *   - Space Grotesk → display / headings (geometric, premium, distinctive).
 *   - Inter         → body / UI text (workhorse legibility).
 *
 * Both are variable fonts, so we omit `weight` and get the full axis range.
 * They are exposed as CSS variables and mapped in tailwind.config.ts to the
 * `font-display` and `font-sans` utilities. Apply the two `.variable`
 * classNames on <html> (see app/layout.tsx).
 */
import { Inter, Space_Grotesk } from "next/font/google";

export const fontSans = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

export const fontDisplay = Space_Grotesk({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-display",
});

/** Convenience: both font CSS-variable classNames, space-joined, for <html>. */
export const fontVariables = `${fontSans.variable} ${fontDisplay.variable}`;
