/**
 * Shared motion system for CoverCraft.
 *
 * One source of truth for easing, duration and the reusable Framer Motion
 * variants used across the storefront and admin. Keep every animation on these
 * tokens so the whole product decelerates with the same premium feel.
 *
 * Reduced motion is handled centrally by <MotionProvider> (MotionConfig
 * reducedMotion="user"), so components can use these variants freely without
 * each re-implementing the accessibility guard. globals.css additionally
 * neutralises CSS-driven animation/transition for the same users.
 */
import type { Variants, Transition } from "framer-motion";

/** ease-out-expo — confident, premium deceleration. No bouncy/linear defaults. */
export const EASE_OUT_EXPO = [0.22, 1, 0.36, 1] as const;

/** Duration scale in seconds. Micro-interactions 150–300ms; section entrances 400–600ms. */
export const DUR = {
  micro: 0.18,
  base: 0.28,
  section: 0.5,
  slow: 0.6,
} as const;

/** Default section-entrance transition. */
export const transition: Transition = { duration: DUR.section, ease: EASE_OUT_EXPO };

/** Shared `whileInView` viewport config — reveal once, a touch before fully on-screen. */
export const viewportOnce = { once: true, margin: "0px 0px -48px 0px" } as const;

export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: DUR.section, ease: EASE_OUT_EXPO } },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: DUR.section, ease: EASE_OUT_EXPO } },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.94 },
  show: { opacity: 1, scale: 1, transition: { duration: DUR.base, ease: EASE_OUT_EXPO } },
};

export const slideInFromRight: Variants = {
  hidden: { opacity: 0, x: 32 },
  show: { opacity: 1, x: 0, transition: { duration: DUR.section, ease: EASE_OUT_EXPO } },
};

/** Parent that reveals its children in sequence. Pair with fadeInUp/scaleIn children. */
export const staggerContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.04 } },
};

/** Tighter stagger for dense grids (product cards, stat cards). */
export const staggerGrid: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
};

/** Reusable hover/tap feedback for primary buttons — scale up on hover, press in on tap. */
export const buttonInteraction = {
  whileHover: { scale: 1.03 },
  whileTap: { scale: 0.97 },
  transition: { duration: DUR.micro, ease: EASE_OUT_EXPO },
} as const;
