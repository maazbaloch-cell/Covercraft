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

/* ------------------------------------------------------------------ *
 * Cinematic layer (Phase 2). Longer, "camera"-grade motion for the
 * immersive surfaces (home, product worlds, product detail). Built on
 * the same easing philosophy; reduced-motion is still handled centrally
 * by <MotionProvider> so these are safe to use directly.
 * ------------------------------------------------------------------ */

/** Smoother expo-out for scroll-driven camera moves. */
export const EASE_CINEMATIC = [0.16, 1, 0.3, 1] as const;
/** Gentle in-out for pinned pans and parallax settles. */
export const EASE_SOFT_INOUT = [0.65, 0, 0.35, 1] as const;

/** Longer durations for immersive scenes (seconds). */
export const DUR_CINEMA = { entrance: 0.9, epic: 1.25, pan: 1.6 } as const;

/** Page-level transition. Wrap route content; pair with AnimatePresence mode="wait". */
export const pageTransition: Variants = {
  hidden: { opacity: 0, y: 16, filter: "blur(6px)" },
  show: {
    opacity: 1, y: 0, filter: "blur(0px)",
    transition: { duration: DUR_CINEMA.entrance, ease: EASE_CINEMATIC },
  },
  exit: {
    opacity: 0, y: -12, filter: "blur(6px)",
    transition: { duration: DUR.base, ease: EASE_OUT_EXPO },
  },
};

/** Dramatic single-element reveal — larger travel + blur, for hero lines and focal art. */
export const cinematicReveal: Variants = {
  hidden: { opacity: 0, y: 40, filter: "blur(10px)" },
  show: {
    opacity: 1, y: 0, filter: "blur(0px)",
    transition: { duration: DUR_CINEMA.entrance, ease: EASE_CINEMATIC },
  },
};

/** Blur-in fade for images/objects that should "focus" into the frame. */
export const blurIn: Variants = {
  hidden: { opacity: 0, scale: 1.06, filter: "blur(14px)" },
  show: {
    opacity: 1, scale: 1, filter: "blur(0px)",
    transition: { duration: DUR_CINEMA.epic, ease: EASE_CINEMATIC },
  },
};

/** Ambient float loop for hero objects. Transform disabled automatically under reduced motion. */
export const floatLoop = {
  animate: { y: [0, -14, 0] },
  transition: { duration: 6.5, ease: "easeInOut", repeat: Infinity },
} as const;

/** Headline stagger — reveal a title word-by-word (or line-by-line). */
export const lineStagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};
export const lineChild: Variants = {
  hidden: { opacity: 0, y: 24, filter: "blur(6px)" },
  show: {
    opacity: 1, y: 0, filter: "blur(0px)",
    transition: { duration: DUR.section, ease: EASE_CINEMATIC },
  },
};
