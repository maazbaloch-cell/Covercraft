"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { EASE_CINEMATIC } from "@/lib/motion";
import { hasArmedTransition } from "@/lib/transition";

/**
 * Global page transition (Phase 12).
 *
 * Unlike `layout.tsx` (persistent), Next.js remounts `template.tsx` on every
 * route navigation — so this plays a gentle entrance on each page change,
 * tying the storefront's separate routes into one continuous experience.
 *
 * Three deliberate constraints keep it from fighting the earlier phases:
 *
 * 1. OPACITY ONLY — never transform/filter. A transform or filter here would
 *    establish a containing block for `position: fixed` descendants and break
 *    the Phase 6 arrival overlay + Phase 9 FLIP ghost (both fixed, both fire on
 *    arrival), and would re-anchor the home page's `position: sticky` scenes.
 *    Opacity touches none of those, and still fades under reduced motion
 *    (MotionProvider = MotionConfig reducedMotion="user"), which is a11y-safe.
 *
 * 2. STEP ASIDE when a bespoke cross-route transition is armed (Sports dive /
 *    product FLIP). Those own the arrival with their own fixed, fully-opaque
 *    cover; a global fade would dim that cover and reveal the route seam. We
 *    only PEEK the handoff flag — the real consumers still read + clear it.
 *
 * 3. SKIP THE FIRST MOUNT (initial hard load) so content paints immediately
 *    (no opacity:0 SSR → no LCP hit / fade-in flash on load); only client-side
 *    navigations fade.
 *
 * No hydration mismatch: the server always takes the no-fade branch (window is
 * undefined and `isFirstMount` is true), and on the client the very first mount
 * also takes it (`isFirstMount` still true until its effect runs). `skipFade`
 * is therefore only ever `false` on a genuine client navigation, never during
 * hydration.
 */

// Module scope: true only until the first Template mount of this page-session.
// Mutated exclusively in a client effect (never on the server), so every SSR
// render reads `true` and hydration always matches the server markup.
let isFirstMount = true;

export default function Template({ children }: { children: React.ReactNode }) {
  const [skipFade] = useState(() => isFirstMount || hasArmedTransition());

  useEffect(() => {
    isFirstMount = false;
  }, []);

  if (skipFade) return <>{children}</>;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.34, ease: EASE_CINEMATIC }}
    >
      {children}
    </motion.div>
  );
}
