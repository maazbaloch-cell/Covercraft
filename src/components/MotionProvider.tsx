"use client";

import { MotionConfig } from "framer-motion";

/**
 * Global Framer Motion config. `reducedMotion="user"` makes every motion
 * component respect the OS "reduce motion" setting: transform/layout animations
 * are disabled while opacity/colour still fade, so the app stays calm and
 * accessible without each component re-checking the preference.
 *
 * Framer Motion animates via JS (inline transforms), so the CSS
 * prefers-reduced-motion guard in globals.css cannot reach it — this is the
 * single place that guard is enforced for motion components.
 */
export default function MotionProvider({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
