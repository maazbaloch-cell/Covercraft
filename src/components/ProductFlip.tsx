"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { consumeProductFlip } from "@/lib/transition";
import { EASE_CINEMATIC } from "@/lib/motion";

/**
 * ProductFlip — the receiving half of the product-entry FLIP (Phase 9).
 *
 * When the visitor taps a cover on /shop, the card stashes that image's viewport
 * rect + src (see armProductFlip). On the product page this overlay reads it once,
 * renders a fixed "ghost" of the cover at the card's old position, and flies it to
 * the detail hero — so the two routes read as one continuous move. It hides the
 * real hero only for the ~0.55s flight, then restores it and unmounts.
 *
 * Mounted as a sibling of <ProductDetail> so the product page's data + logic are
 * untouched. Purely decorative: aria-hidden, pointer-events-none. Safety first —
 * a hard timeout always restores the hero, so an interrupted flight can never
 * leave it hidden; renders nothing on a normal (non-flip) visit or reduced motion.
 *
 * NOTE — this animates the layout box (top/left/width/height), NOT a compositor
 * transform, by design. The card image (aspect 4/4.35) and the hero (square) differ
 * in aspect ratio, so a transform scale would be non-uniform and visibly stretch the
 * object-cover image mid-flight; interpolating the box instead lets object-cover
 * re-crop each frame and land pixel-matched on the hero. The ghost is a single fixed
 * element with one <img> child, so this reflows only its own subtree — never page
 * content — making the cost negligible and a transform rewrite a net visual regression.
 */

const FLIP_DURATION = 0.55; // seconds
const HERO_SELECTOR = "[data-flip-hero]";

// Read the one-shot payload before the browser paints so the ghost is already in
// place (and the hero already hidden) on the first frame — no flash of a duplicate.
const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

interface Rect { top: number; left: number; width: number; height: number }
interface FlipState { start: Rect; end: Rect; src: string; radius: number }

export default function ProductFlip() {
  const reduce = useReducedMotion();
  const [flip, setFlip] = useState<FlipState | null>(null);
  const heroRef = useRef<HTMLElement | null>(null);
  const timerRef = useRef<number | null>(null);

  // Restore the hero and tear down the ghost. Idempotent and always safe to call.
  const finish = () => {
    if (timerRef.current !== null) { window.clearTimeout(timerRef.current); timerRef.current = null; }
    if (heroRef.current) { heroRef.current.style.opacity = ""; heroRef.current = null; }
    setFlip(null);
  };

  useIsomorphicLayoutEffect(() => {
    // Always consume so a stale flag can never leak into a later visit.
    const payload = consumeProductFlip();
    if (!payload || reduce) return;

    const hero = document.querySelector(HERO_SELECTOR) as HTMLElement | null;
    if (!hero) return; // No landing target — leave the hero visible, no flip.

    const r = hero.getBoundingClientRect();
    // Skip if the hero isn't laid out yet (0-sized) — avoids a broken flight.
    if (r.width < 1 || r.height < 1) return;

    // Hide the real hero for the flight so only the ghost is visible (no duplicate).
    hero.style.opacity = "0";
    heroRef.current = hero;

    setFlip({
      start: payload.rect,
      end: { top: r.top, left: r.left, width: r.width, height: r.height },
      src: payload.src,
      radius: payload.radius,
    });

    // Guarantee restoration even if onAnimationComplete never fires (tab hidden,
    // interrupted navigation, etc.). The hero must never stay hidden.
    timerRef.current = window.setTimeout(finish, FLIP_DURATION * 1000 + 300);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduce]);

  // Clean up the safety timer if the component unmounts mid-flight.
  useEffect(() => () => { if (timerRef.current !== null) window.clearTimeout(timerRef.current); }, []);

  return (
    <AnimatePresence>
      {flip && (
        <motion.div
          key="product-flip"
          aria-hidden
          className="pointer-events-none fixed z-[120] overflow-hidden bg-slate-100 shadow-[0_30px_60px_-20px_rgba(2,6,23,0.4)]"
          initial={{ top: flip.start.top, left: flip.start.left, width: flip.start.width, height: flip.start.height, borderRadius: flip.radius }}
          animate={{ top: flip.end.top, left: flip.end.left, width: flip.end.width, height: flip.end.height, borderRadius: 24 }}
          exit={{ opacity: 0, transition: { duration: 0.14 } }}
          transition={{ duration: FLIP_DURATION, ease: EASE_CINEMATIC }}
          onAnimationComplete={finish}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={flip.src} alt="" className="h-full w-full object-cover" />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
