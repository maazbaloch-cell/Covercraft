"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { consumeSportsDive } from "@/lib/transition";
import { EASE_CINEMATIC, EASE_SOFT_INOUT } from "@/lib/motion";

/**
 * CatalogArrival — the receiving half of the Sports→Catalog single-shot (Phase 6).
 *
 * When the visitor arrives via the Sports "dive", the launch overlay left the
 * screen fully covered in emerald; this overlay starts in that same covered
 * state and pulls away — the camera settling onto the catalog — so the two
 * routes read as one continuous move. It renders nothing on a normal visit.
 *
 * Mounted as a sibling of <ShopCatalog> so the catalog's business logic is
 * untouched. Purely decorative: aria-hidden, pointer-events-none, and it
 * unmounts itself the moment the reveal finishes.
 */

// Read the one-shot flag before the browser paints so the overlay is already
// covering on the first frame (no flash of the bare catalog). Falls back to a
// passive effect during SSR, where layout effects are a no-op anyway.
const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

export default function CatalogArrival() {
  const reduce = useReducedMotion();
  const [playing, setPlaying] = useState(false);

  useIsomorphicLayoutEffect(() => {
    // Always consume the flag so it can never leak into a later visit — but only
    // play the reveal when motion is allowed.
    const arrived = consumeSportsDive();
    if (arrived && !reduce) setPlaying(true);
  }, [reduce]);

  return (
    <AnimatePresence>
      {playing && (
        <motion.div
          key="catalog-arrival"
          aria-hidden
          className="pointer-events-none fixed inset-0 z-[120] overflow-hidden"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: EASE_SOFT_INOUT }}
        >
          {/* Emerald fill pulling back — the camera lifting off the grid. This is
              the slowest layer, so its completion ends the whole reveal. */}
          <motion.div
            className="absolute inset-0 bg-[#04120c]"
            initial={{ opacity: 1, scale: 1 }}
            animate={{ opacity: 0, scale: 1.12 }}
            transition={{ duration: 0.75, ease: EASE_CINEMATIC }}
            onAnimationComplete={() => setPlaying(false)}
          />
          {/* Energy field, matching the dive's palette. */}
          <motion.div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(60% 55% at 50% 45%, rgba(16,185,129,0.55), transparent 62%), radial-gradient(45% 40% at 78% 78%, rgba(163,230,53,0.4), transparent 60%)",
            }}
            initial={{ opacity: 1, scale: 1 }}
            animate={{ opacity: 0, scale: 1.25 }}
            transition={{ duration: 0.7, ease: EASE_CINEMATIC }}
          />
          {/* Speed streaks decelerating and fading — the same 58° motif as the launch. */}
          <motion.div
            className="absolute inset-0"
            style={{
              background:
                "repeating-linear-gradient(58deg, transparent 0 16px, rgba(255,255,255,0.10) 16px 18px, transparent 18px 30px)",
            }}
            initial={{ opacity: 0.7, scale: 1.15 }}
            animate={{ opacity: 0, scale: 1 }}
            transition={{ duration: 0.55, ease: EASE_SOFT_INOUT }}
          />
          {/* Center flash blooming out. */}
          <motion.div
            className="absolute inset-0"
            style={{ background: "radial-gradient(30% 30% at 50% 45%, rgba(236,253,245,0.9), transparent 70%)" }}
            initial={{ opacity: 0.9, scale: 0.6 }}
            animate={{ opacity: 0, scale: 2.4 }}
            transition={{ duration: 0.5, ease: EASE_CINEMATIC }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
