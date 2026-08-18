"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import type { CatalogProduct } from "@/components/ShopCatalog";
import { resolveProductImage } from "@/lib/productImage";
import { EASE_CINEMATIC, cinematicReveal, viewportOnce } from "@/lib/motion";

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

export default function ScrollStory({ cover }: { cover?: CatalogProduct }) {
  const reduce = useReducedMotion();
  const trackRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: trackRef, offset: ["start start", "end end"] });

  // Camera push — the whole device eases in, then settles.
  const deviceScale = useTransform(scrollYProgress, [0, 0.35, 1], [0.82, 1.06, 1.0]);
  const deviceRotate = useTransform(scrollYProgress, [0, 1], [-3, 4]);

  // Cover separation — the printed shell lifts off, drifts and tilts away.
  const shellY = useTransform(scrollYProgress, [0.35, 0.72], [0, -130]);
  const shellX = useTransform(scrollYProgress, [0.35, 0.72], [0, 64]);
  const shellRotate = useTransform(scrollYProgress, [0.35, 0.74], [0, 12]);
  const shellScale = useTransform(scrollYProgress, [0.35, 0.72], [1, 1.05]);

  // The engineering beneath is revealed as the shell leaves.
  const bodyGlow = useTransform(scrollYProgress, [0.35, 0.7], [0.15, 0.6]);
  const hintOpacity = useTransform(scrollYProgress, [0, 0.12], [1, 0]);

  // Three narrative panels cross-fade in step with the mechanics.
  const p0Opacity = useTransform(scrollYProgress, [0, 0.04, 0.24, 0.32], [0, 1, 1, 0]);
  const p0Y = useTransform(scrollYProgress, [0, 0.32], [0, -24]);
  const p1Opacity = useTransform(scrollYProgress, [0.34, 0.42, 0.58, 0.66], [0, 1, 1, 0]);
  const p1Y = useTransform(scrollYProgress, [0.34, 0.66], [28, -24]);
  const p2Opacity = useTransform(scrollYProgress, [0.68, 0.78, 1], [0, 1, 1]);
  const p2Y = useTransform(scrollYProgress, [0.68, 0.86], [28, 0]);

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
            <div className="relative h-[420px] w-[210px]">
              <DeviceChassis>
                <PhoneBackFace />
                {/* Cover offset up-and-out to imply the exploded/separated view */}
                <div className="absolute inset-0 -translate-y-6 translate-x-4 rotate-6">
                  <CoverArtFace cover={cover} />
                </div>
              </DeviceChassis>
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
      <div className="sticky top-0 flex h-[100svh] items-center overflow-hidden">
        {/* framing */}
        <div aria-hidden className="vignette pointer-events-none absolute inset-0" />
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

            <motion.div style={{ scale: deviceScale, rotate: deviceRotate }} className="will-cinema relative h-[300px] w-[150px] sm:h-[460px] sm:w-[230px]">
              {/* growing ambient light behind the revealed body */}
              <motion.div style={{ opacity: bodyGlow }} aria-hidden className="pointer-events-none absolute -inset-10 -z-10 rounded-full bg-accent-600/35 blur-3xl" />

              <DeviceChassis>
                <PhoneBackFace />
                {/* the printed cover, which lifts away */}
                <motion.div style={{ y: shellY, x: shellX, rotate: shellRotate, scale: shellScale }} className="will-cinema absolute inset-0">
                  <CoverArtFace cover={cover} />
                </motion.div>
              </DeviceChassis>
            </motion.div>
          </div>
        </div>

        {/* film scrubber */}
        <div aria-hidden className="absolute inset-x-0 bottom-0 h-px bg-white/10">
          <motion.div style={{ scaleX: scrollYProgress }} className="h-full origin-left bg-accent-500" />
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ *
 * Pieces shared by the animated and reduced-motion paths.
 * ------------------------------------------------------------------ */

/** The phone chassis (outer frame). Children are the stacked back + cover. */
function DeviceChassis({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative h-full w-full rounded-[2.4rem] border border-white/15 bg-gradient-to-b from-white/10 to-white/[0.02] p-2.5 shadow-depth-lg">
      <div className="relative h-full w-full">{children}</div>
    </div>
  );
}

/** The phone's back, revealed once the cover lifts away. */
function PhoneBackFace() {
  return (
    <div className="absolute inset-0 overflow-hidden rounded-[1.9rem] border border-white/10 bg-gradient-to-b from-ink-700 via-ink-800 to-ink-950">
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.06] to-transparent" />
      {/* real camera module */}
      <div className="absolute left-4 top-4 flex h-[4.25rem] w-[4.25rem] items-center justify-center rounded-2xl border border-white/12 bg-black/50">
        <div className="grid grid-cols-2 gap-1.5">
          <span className="h-5 w-5 rounded-full bg-ink-950 ring-2 ring-white/10" />
          <span className="h-5 w-5 rounded-full bg-ink-950 ring-2 ring-white/10" />
          <span className="h-5 w-5 rounded-full bg-ink-950 ring-2 ring-white/10" />
          <span className="h-5 w-5 rounded-full bg-accent-500/50 ring-2 ring-white/10" />
        </div>
      </div>
      <span className="absolute bottom-5 left-1/2 -translate-x-1/2 text-[9px] font-semibold uppercase tracking-[0.3em] text-white/30">Engineered inside</span>
    </div>
  );
}

/** The printed cover face (the removable shell). */
function CoverArtFace({ cover }: { cover?: CatalogProduct }) {
  const [failed, setFailed] = useState(false);
  const src = cover ? resolveProductImage(cover.imageUrl, failed) : null;
  return (
    <div className="relative h-full w-full overflow-hidden rounded-[1.9rem] shadow-depth-lg">
      {src ? (
        <Image src={src} alt={cover?.title ?? "Cover"} fill sizes="230px" className="object-cover" onError={() => setFailed(true)} />
      ) : (
        <div className="h-full w-full bg-gradient-to-br from-accent-500 via-accent-700 to-ink-900" />
      )}
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-transparent via-white/12 to-transparent" />
      {/* camera cutout aligned over the body's module */}
      <div className="absolute left-4 top-4 h-[4.25rem] w-[4.25rem] rounded-2xl border border-white/25 bg-black/20 backdrop-blur-[1px]" />
      <span className="absolute bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-black uppercase tracking-[0.3em] text-white/60">CoverCraft</span>
      <div aria-hidden className="pointer-events-none absolute inset-0 rounded-[1.9rem] ring-1 ring-inset ring-white/15" />
    </div>
  );
}

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
