"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform, useSpring, useReducedMotion } from "framer-motion";
import { cinematicReveal, viewportOnce } from "@/lib/motion";
import { IphoneFrame, PhoneBackSurface, CoverSkin } from "./DevicePhone";
import Phone3D from "./Phone3D";

/**
 * ScrollStory — the "ENTER the product" scene (Phase 4).
 *
 * A pinned, scroll-driven sequence: the camera pushes into the device, then the
 * printed cover SEPARATES from the phone body to reveal the engineering beneath,
 * while three narrative panels cross-fade. This is the DISCOVER → ENTER beat.
 *
 * Technique: a tall track (h-[300vh]) with a sticky, viewport-height inner scene.
 * useScroll(target) → scrollYProgress (0→1) drives every transform via useTransform.
 * No GSAP/Lenis — pure framer-motion. Sticky works because the Home root uses
 * `overflow-x-clip` (not `overflow-hidden`), which does not create a scroll
 * container. Everything scroll-linked is fully gated on prefers-reduced-motion:
 * reduced-motion users get a static, readable "exploded" layout instead of a pin.
 */

const STAGES = [
  {
    step: "01",
    kicker: "Meet",
    title: "This is your cover.",
    body: "A finish chosen to feel considered the moment you pick it up — colour, texture and weight in balance.",
  },
  {
    step: "02",
    kicker: "Open",
    title: "Watch it come apart.",
    body: "Precision-molded to your exact phone. Every port, button and lens sits exactly where it belongs.",
  },
  {
    step: "03",
    kicker: "Protect",
    title: "Protection you forget is there.",
    body: "Shock-absorbing corners, a raised camera lip and wireless-charging clarity — built to disappear until the day you need it.",
  },
] as const;

const SPECS = ["1.2 m drop-tested", "1.9 mm slim", "Qi wireless-ready", "Raised camera lip"] as const;

export default function ScrollStory() {
  const reduceRaw = useReducedMotion();
  // Defer the reduced-motion branch until after mount. useReducedMotion() reads
  // matchMedia (client-only): branching the returned tree on it at render time
  // makes the server (always false → pinned scene) and a reduced-motion client's
  // first render (static tree) disagree → a hydration mismatch + layout flash.
  // Gating on `mounted` keeps server + first client render on the pinned branch
  // (they match), then honors the real preference once we're safely mounted.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const reduce = mounted && reduceRaw;
  const trackRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: trackRef, offset: ["start start", "end end"] });

  // Smooth the raw scroll signal with a spring so the pinned sequence glides
  // instead of snapping 1:1 to every scroll delta. Stiffness is kept high (and
  // mass low) so the phone still tracks the finger closely — enough inertia to
  // feel silky, not so much that the device visibly lags behind the scrollbar.
  const progress = useSpring(scrollYProgress, { stiffness: 130, damping: 30, mass: 0.35 });

  // Camera push is driven ENTIRELY inside the 3D scene: Phone3DCanvas runs a
  // subtle group dolly-out in useFrame (scale ← 1 - sep*0.1) as the case lifts,
  // so the composition stays framed. We deliberately do NOT also CSS-scale the
  // canvas container here — a CSS transform resamples the raster <canvas> every
  // frame, softening/distorting the phone during scroll, and having two size
  // controllers (CSS scale + 3D dolly) fight each other. One controller (the 3D
  // one) keeps the phone crisp and the motion coherent.

  // Cover separation (0→1) + a gentle yaw orbit, fed straight into Phone3D. The
  // 3D case is a real extruded shell with a camera cutout, so it lifts off with
  // visible thickness, inner walls and a shadow onto the body — not a sticker.
  const sep = useTransform(progress, [0.35, 0.72], [0, 1]);
  const spin = useTransform(progress, [0, 1], [0, 0.9]);

  // The engineering beneath is revealed as the shell leaves.
  const bodyGlow = useTransform(progress, [0.35, 0.7], [0.15, 0.6]);
  const hintOpacity = useTransform(progress, [0, 0.12], [1, 0]);

  // Three narrative panels cross-fade in step with the mechanics.
  const p0Opacity = useTransform(progress, [0, 0.04, 0.24, 0.32], [0, 1, 1, 0]);
  const p0Y = useTransform(progress, [0, 0.32], [0, -24]);
  const p1Opacity = useTransform(progress, [0.34, 0.42, 0.58, 0.66], [0, 1, 1, 0]);
  const p1Y = useTransform(progress, [0.34, 0.66], [28, -24]);
  const p2Opacity = useTransform(progress, [0.68, 0.78, 1], [0, 1, 1]);
  const p2Y = useTransform(progress, [0.68, 0.86], [28, 0]);

  // ----- Reduced-motion / no-JS-friendly fallback: a static "exploded" view. -----
  if (reduce) {
    return (
      <section className="relative mx-auto w-full max-w-[var(--cinema-max)] px-6 py-24">
        <motion.div variants={cinematicReveal} initial="hidden" whileInView="show" viewport={viewportOnce} className="text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-accent-400">Enter the product</p>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-cinema text-white sm:text-4xl">The anatomy of a CoverCraft cover</h2>
        </motion.div>

        <div className="mt-14 grid items-center gap-12 lg:grid-cols-2">
          {/* Static exploded device */}
          <div className="flex justify-center">
            <div className="relative h-[440px] w-[214px]">
              <IphoneFrame className="h-full w-full">
                <PhoneBackSurface />
                {/* Case offset up-and-out to imply the exploded/separated view */}
                <div className="absolute inset-0 -translate-y-8 translate-x-5 rotate-6">
                  <CoverSkin variant="cover" />
                </div>
              </IphoneFrame>
            </div>
          </div>

          {/* The three beats as a clean list */}
          <ol className="space-y-8">
            {STAGES.map((s) => (
              <li key={s.step} className="flex gap-4">
                <span className="mt-0.5 font-display text-lg font-bold text-accent-400">{s.step}</span>
                <div>
                  <h3 className="font-display text-xl font-bold text-white">{s.title}</h3>
                  <p className="mt-1.5 text-sm leading-6 text-slate-300">{s.body}</p>
                </div>
              </li>
            ))}
            <li className="flex flex-wrap gap-2 pt-1">
              {SPECS.map((spec) => (
                <span key={spec} className="rounded-full border border-white/12 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-200">{spec}</span>
              ))}
            </li>
            <li>
              <Link href="/shop" className="group inline-flex items-center gap-2 rounded-full bg-accent-600 px-6 py-3 text-sm font-bold text-white shadow-glow transition-transform duration-200 hover:scale-[1.03] hover:bg-accent-500 active:scale-95">
                Step inside the shop
                <Arrow />
              </Link>
            </li>
          </ol>
        </div>
      </section>
    );
  }

  // ----- Full pinned, scroll-driven scene. -----
  return (
    <section ref={trackRef} className="relative h-[300vh]">
      {/* Pinned scene uses svh (small viewport height), not vh: on mobile `vh`
          is the chrome-hidden height, so a `h-screen` pin clips top/bottom while
          the URL bar shows and jumps when it collapses mid-scroll. svh is stable
          and fits the visible area; on desktop svh == vh so nothing changes. */}
      {/* No overflow-hidden here: the pinned scene must let the 3D phone + the
          peeling case use their full frame as they separate. Clipping was the
          root cause of the "phone gets cut" report. This scene adds NO background
          of its own — it sits directly on the page's shared fixed canvas, so it
          reads as one continuous surface with the hero above and the worlds below. */}
      <div className="sticky top-0 flex h-[100svh] items-center">
        {/* framing — NO local vignette here. The page's global fixed background
            (HomeExperience) already applies ONE vignette across the whole
            viewport; adding a second inset shadow only in this pinned scene made
            banner 2's edges visibly darker than the hero and the lower worlds,
            reading as a boxed section / horizontal boundary. Dropping it makes
            the upper banners share the exact same continuous background. */}
        <p className="absolute left-1/2 top-20 -translate-x-1/2 text-[11px] font-bold uppercase tracking-[0.32em] text-accent-400/90">
          Enter the product
        </p>

        <div className="mx-auto grid w-full max-w-[var(--cinema-max)] grid-cols-1 items-center gap-8 px-6 lg:grid-cols-2">
          {/* Narrative panels (stacked, cross-fading) */}
          <div className="relative order-2 h-[14rem] sm:h-[15rem] lg:order-1">
            <StoryPanel opacity={p0Opacity} y={p0Y} stage={STAGES[0]} />
            <StoryPanel opacity={p1Opacity} y={p1Y} stage={STAGES[1]} />
            <StoryPanel opacity={p2Opacity} y={p2Y} stage={STAGES[2]}>
              <div className="mt-4 flex flex-wrap gap-2">
                {SPECS.map((spec) => (
                  <span key={spec} className="rounded-full border border-white/12 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-200">{spec}</span>
                ))}
              </div>
              <Link href="/shop" className="group mt-6 inline-flex items-center gap-2 rounded-full bg-accent-600 px-6 py-3 text-sm font-bold text-white shadow-glow transition-transform duration-200 hover:scale-[1.03] hover:bg-accent-500 active:scale-95">
                Step inside the shop
                <Arrow />
              </Link>
            </StoryPanel>
          </div>

          {/* The device: camera push + cover separation */}
          <div className="relative order-1 flex items-center justify-center lg:order-2">
            {/* peel affordance */}
            <motion.span
              style={{ opacity: hintOpacity }}
              className="absolute -top-2 left-1/2 z-20 -translate-x-1/2 rounded-full border border-white/15 bg-black/40 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-300 backdrop-blur-sm"
            >
              Scroll to open
            </motion.span>

            {/* HEIGHT-LOCKED, WIDTH FILLS THE COLUMN. The phone's on-screen size
                is set by the fixed height + the camera's VERTICAL fov, so it is
                unchanged — but the box now spans the full column width (w-full,
                capped) instead of a narrow fixed 332px. R3F derives the camera's
                HORIZONTAL field from the canvas aspect ratio, so a wider box shows
                more world left/right, giving the separating + rotating orange case
                room to travel right and stay FULLY rendered. (The old narrow box
                was the hard vertical cut: the case projected past the canvas's own
                right edge, which a <canvas> never draws beyond.) w-full is bounded
                by the column → no horizontal overflow / no scrollbar; the canvas is
                never CSS-scaled → the phone stays crisp; R3F auto-resizes. */}
            <div className="relative h-[420px] w-full max-w-[360px] sm:h-[560px] sm:max-w-[560px]">
              {/* growing ambient light behind the revealed body */}
              <motion.div style={{ opacity: bodyGlow }} aria-hidden className="pointer-events-none absolute -inset-10 -z-10 rounded-full bg-cover-500/30 blur-3xl" />

              {/* The real WebGL device: the titanium body + camera module stay put
                  while the orange case — a physical shell with a real camera
                  cutout — lifts off, driven by `sep`; `spin` gently orbits it. */}
              <Phone3D skin="cover" separation={sep} spin={spin} className="h-full w-full" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ *
 * The device (titanium frame, bare back + camera, and the removable orange
 * case) now lives in ./DevicePhone and is shared by every home scene.
 * ------------------------------------------------------------------ */

/** One cross-fading narrative panel, positioned absolutely over its siblings. */
function StoryPanel({
  opacity,
  y,
  stage,
  children,
}: {
  opacity: import("framer-motion").MotionValue<number>;
  y: import("framer-motion").MotionValue<number>;
  stage: (typeof STAGES)[number];
  children?: React.ReactNode;
}) {
  return (
    <motion.div style={{ opacity, y }} className="absolute inset-0 text-center lg:text-left">
      <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-accent-400">
        {stage.step} — {stage.kicker}
      </p>
      <h3 className="mt-3 font-display text-3xl font-bold leading-tight tracking-cinema text-white sm:text-4xl">{stage.title}</h3>
      <p className="mx-auto mt-3 max-w-md text-base leading-7 text-slate-300 lg:mx-0">{stage.body}</p>
      {children}
    </motion.div>
  );
}

function Arrow() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}
