"use client";

import { useEffect, useState } from "react";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "framer-motion";
import { DUR, EASE_CINEMATIC, EASE_OUT_EXPO } from "@/lib/motion";

/**
 * AuthShowcase — the cinematic stage for the /account front door.
 *
 * A code-only "premium product commercial" built entirely from CSS 3D +
 * Framer Motion (no external assets, no new deps). A realistic-feeling phone,
 * rendered with real depth/lighting/shadow, is the hero; the storefront's
 * actual cover-art SVGs are the covers on show.
 *
 *   • SIGN IN  — the phone floats in a lit environment while premium covers
 *     drift around it and one is periodically "chosen" onto the screen.
 *   • SIGN UP  — the signature transformation: the cover separates off the
 *     phone, floats forward, the camera orbits its artwork, then it reassembles
 *     onto the phone. A different scene inside the same universe.
 *
 * Runs alongside an always-usable form (never blocks input). Fully gated on
 * prefers-reduced-motion: every loop/parallax/orbit falls back to a clean,
 * composed still frame. Responsive: a tall stage on desktop, a compact
 * cinematic header on mobile (not a scaled-down desktop panel).
 */

type Mode = "login" | "signup" | "reset";

const COPY: Record<Mode, { eyebrow: string; title: string; sub: string }> = {
  login: {
    eyebrow: "Welcome back",
    title: "Your covers, right where you left them.",
    sub: "Sign in to pick up your saved designs, orders and wishlist.",
  },
  signup: {
    eyebrow: "Join CoverCraft",
    title: "A phone that's unmistakably yours.",
    sub: "Create an account to design, save and track covers made for you.",
  },
  reset: {
    eyebrow: "Account recovery",
    title: "Let's get you back in.",
    sub: "We'll send a secure code so you can set a fresh password.",
  },
};

// Real storefront cover art — the phone cycles these; the case shows one.
const COVERS = [
  "/products/aurora-gradient.svg",
  "/products/liquid-marble.svg",
  "/products/neon-cyberpunk.svg",
  "/products/sunset-fade.svg",
  "/products/geometric-prism.svg",
  "/products/midnight-carbon.svg",
];

// Deterministic (no Math.random → no hydration drift) floating cover cards.
const CARDS = [
  { src: "/products/liquid-marble.svg", top: "14%", left: "8%", rot: -13, dur: 7.5, delay: 0, hideSm: false },
  { src: "/products/neon-cyberpunk.svg", top: "58%", left: "5%", rot: 10, dur: 8.6, delay: 0.6, hideSm: true },
  { src: "/products/sunset-fade.svg", top: "20%", left: "80%", rot: 12, dur: 8.1, delay: 1.1, hideSm: false },
  { src: "/products/geometric-prism.svg", top: "66%", left: "78%", rot: -9, dur: 7.9, delay: 0.3, hideSm: true },
];

// Ambient depth particles (deterministic).
const PARTICLES = [
  { top: "18%", left: "22%", s: 3, dur: 7, delay: 0 },
  { top: "72%", left: "30%", s: 2.2, dur: 8.4, delay: 0.8 },
  { top: "40%", left: "88%", s: 2.6, dur: 7.8, delay: 1.5 },
  { top: "82%", left: "62%", s: 3.2, dur: 9, delay: 0.4 },
  { top: "12%", left: "60%", s: 2, dur: 6.6, delay: 1.2 },
];

export default function AuthShowcase({ mode }: { mode: Mode }) {
  const reduce = useReducedMotion();
  const isSignup = mode === "signup";
  const copy = COPY[mode];

  // The cover shown on the phone screen, cross-faded on a timer.
  const [cover, setCover] = useState(0);
  useEffect(() => {
    if (reduce) return;
    const id = setInterval(() => setCover((c) => (c + 1) % COVERS.length), 3200);
    return () => clearInterval(id);
  }, [reduce]);

  // Pointer parallax → spring-smoothed, fanned across depth layers. Stays 0
  // (handlers unbound) under reduced motion.
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 90, damping: 18, mass: 0.5 });
  const sy = useSpring(my, { stiffness: 90, damping: 18, mass: 0.5 });
  const tiltY = useTransform(sx, (v) => v * 12); // phone yaw
  const tiltX = useTransform(sy, (v) => v * -8); // phone pitch
  const glowX = useTransform(sx, (v) => v * 26);
  const glowY = useTransform(sy, (v) => v * 26);
  const cardX = useTransform(sx, (v) => v * 40);
  const cardY = useTransform(sy, (v) => v * 40);

  const onMove = reduce
    ? undefined
    : (e: React.MouseEvent<HTMLDivElement>) => {
        const r = e.currentTarget.getBoundingClientRect();
        mx.set(Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width / 2)) / (r.width / 2))));
        my.set(Math.max(-1, Math.min(1, (e.clientY - (r.top + r.height / 2)) / (r.height / 2))));
      };
  const onLeave = reduce
    ? undefined
    : () => {
        mx.set(0);
        my.set(0);
      };

  return (
    <motion.div
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      initial={{ opacity: 0, scale: reduce ? 1 : 1.06 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: reduce ? DUR.base : 1.1, ease: EASE_CINEMATIC }}
      className="relative block min-h-[21rem] w-full overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-accent-800/40 via-ink-850 to-ink-950 shadow-depth-lg sm:min-h-[26rem] lg:min-h-[34rem]"
    >
      {/* Ambient wash + grain + soft key light (parallax back layer). */}
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-aurora opacity-80 animate-aurora-drift" />
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-grain opacity-[0.12]" />
      <motion.div
        aria-hidden
        style={{ x: glowX, y: glowY }}
        className="pointer-events-none absolute left-1/2 top-[38%] h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent-500/30 blur-3xl animate-pulse-glow"
      />
      <motion.div
        aria-hidden
        style={{ x: glowX, y: glowY }}
        className="pointer-events-none absolute -right-10 bottom-6 h-56 w-56 rounded-full bg-sky-500/15 blur-3xl"
      />

      {/* Ambient particles. */}
      {PARTICLES.map((p, i) => (
        <motion.span
          key={i}
          aria-hidden
          style={{ top: p.top, left: p.left, width: p.s, height: p.s }}
          className="pointer-events-none absolute rounded-full bg-accent-200/70"
          initial={{ opacity: 0 }}
          animate={reduce ? { opacity: 0.5 } : { opacity: [0.2, 0.7, 0.2], y: [0, -14, 0] }}
          transition={reduce ? { duration: 0.4 } : { duration: p.dur, ease: "easeInOut", repeat: Infinity, delay: p.delay }}
        />
      ))}

      {/* Floating premium cover cards (parallax mid layer). */}
      <motion.div aria-hidden style={{ x: cardX, y: cardY }} className="pointer-events-none absolute inset-0">
        {CARDS.map((c, i) => (
          <motion.div
            key={i}
            style={{ top: c.top, left: c.left }}
            className={`absolute h-24 w-16 overflow-hidden rounded-xl border border-white/15 shadow-depth sm:h-28 sm:w-20 ${c.hideSm ? "hidden sm:block" : ""}`}
            initial={{ opacity: 0, rotate: c.rot, scale: 0.9 }}
            animate={
              reduce
                ? { opacity: 0.9, rotate: c.rot, scale: 1 }
                : { opacity: 0.92, rotate: [c.rot, c.rot + 3, c.rot], y: [0, -12, 0], scale: 1 }
            }
            transition={
              reduce
                ? { duration: DUR.base }
                : { opacity: { duration: 0.6, delay: 0.4 + c.delay }, rotate: { duration: c.dur, ease: "easeInOut", repeat: Infinity, delay: c.delay }, y: { duration: c.dur, ease: "easeInOut", repeat: Infinity, delay: c.delay } }
            }
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={c.src} alt="" className="h-full w-full object-cover" />
            <span className="absolute inset-0 bg-gradient-to-t from-ink-950/50 to-transparent" />
          </motion.div>
        ))}
      </motion.div>

      {/* ---- The hero phone (CSS 3D). Parallax tilt + gentle float. ---- */}
      <div className="absolute inset-0 flex items-center justify-center" style={{ perspective: 1200 }}>
        <motion.div
          style={{ rotateX: tiltX, rotateY: tiltY, transformStyle: "preserve-3d" }}
          initial={{ opacity: 0, y: 26 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduce ? DUR.base : 1, ease: EASE_CINEMATIC, delay: reduce ? 0 : 0.25 }}
          className="scale-[0.66] sm:scale-[0.82] lg:scale-100"
        >
          <PhoneStage cover={cover} isSignup={isSignup} reduce={!!reduce} />
        </motion.div>
      </div>

      {/* Vignette to focus the frame. */}
      <div aria-hidden className="vignette pointer-events-none absolute inset-0 rounded-3xl" />

      {/* Copy overlay — crossfades with the auth mode. */}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink-950 via-ink-950/75 to-transparent p-6 pt-16 sm:p-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={mode}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: DUR.base, ease: EASE_OUT_EXPO }}
          >
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-accent-300">{copy.eyebrow}</p>
            <h2 className="mt-2 max-w-sm font-display text-xl font-black leading-tight tracking-cinema text-white sm:text-2xl">
              {copy.title}
            </h2>
            <p className="mt-2 max-w-sm text-sm leading-6 text-slate-300">{copy.sub}</p>
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ *
 * The phone + its separable cover, built with real CSS 3D transforms.
 * ------------------------------------------------------------------ */
function PhoneStage({ cover, isSignup, reduce }: { cover: number; isSignup: boolean; reduce: boolean }) {
  return (
    <div className="relative" style={{ transformStyle: "preserve-3d" }}>
      {/* Contact shadow on the floor — grows as the case lifts (signup). */}
      <motion.div
        aria-hidden
        className="absolute -bottom-10 left-1/2 h-8 w-40 -translate-x-1/2 rounded-[50%] bg-black/60 blur-2xl"
        animate={reduce || !isSignup ? { opacity: 0.5 } : { opacity: [0.55, 0.3, 0.55], scaleX: [1, 1.18, 1] }}
        transition={reduce || !isSignup ? { duration: 0.4 } : { duration: 11, ease: "easeInOut", repeat: Infinity }}
      />

      {/* Gentle whole-phone float. */}
      <motion.div
        style={{ transformStyle: "preserve-3d" }}
        animate={reduce ? undefined : { y: [0, -12, 0], rotateZ: [0, 1.2, 0] }}
        transition={reduce ? undefined : { duration: 7.5, ease: "easeInOut", repeat: Infinity }}
      >
        {/* --- Phone chassis (front / screen) --- */}
        <div
          className="relative h-[400px] w-[196px] rounded-[2.6rem] border border-white/15 bg-gradient-to-b from-ink-700 to-ink-950 p-[6px] shadow-depth-lg"
          style={{ transformStyle: "preserve-3d" }}
        >
          {/* Rim highlight. */}
          <div aria-hidden className="pointer-events-none absolute inset-0 rounded-[2.6rem] shadow-[inset_0_1px_1px_rgba(255,255,255,0.35),inset_0_0_28px_rgba(37,99,235,0.28)]" />
          {/* Screen — cycles real cover art. */}
          <div className="relative h-full w-full overflow-hidden rounded-[2.15rem] bg-ink-950">
            <AnimatePresence>
              <motion.img
                key={cover}
                // eslint-disable-next-line @next/next/no-img-element
                src={COVERS[cover]}
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
                initial={{ opacity: 0, scale: 1.06 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.9, ease: EASE_CINEMATIC }}
              />
            </AnimatePresence>
            {/* Screen sheen sweep. */}
            {!reduce && (
              <motion.div
                aria-hidden
                className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/25 to-transparent"
                animate={{ x: ["-140%", "320%"] }}
                transition={{ duration: 5.4, ease: "easeInOut", repeat: Infinity, repeatDelay: 1.6 }}
              />
            )}
            {/* UI hint bar + brand mark. */}
            <div aria-hidden className="absolute inset-x-0 top-0 flex justify-center pt-2">
              <span className="h-1.5 w-16 rounded-full bg-black/50" />
            </div>
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink-950/80 to-transparent p-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/80">CoverCraft</p>
            </div>
          </div>
          {/* Notch / camera. */}
          <div aria-hidden className="absolute left-1/2 top-3 h-1.5 w-14 -translate-x-1/2 rounded-full bg-black/80" />
        </div>

        {/* --- The separable cover (signup hero). Sits just behind the chassis
               when assembled, then lifts forward, orbits, and returns. --- */}
        <motion.div
          className="absolute inset-0 overflow-hidden rounded-[2.6rem] border border-white/20 shadow-depth-lg"
          style={{ transformStyle: "preserve-3d", backfaceVisibility: "hidden" }}
          animate={
            reduce || !isSignup
              ? { opacity: 0 }
              : {
                  z: [-6, 130, 130, 130, -6, -6],
                  rotateY: [0, -24, 22, -6, 0, 0],
                  rotateZ: [0, -5, 4, 0, 0, 0],
                  y: [0, -14, -8, -16, 0, 0],
                  opacity: [0, 1, 1, 1, 1, 0],
                }
          }
          transition={
            reduce || !isSignup
              ? { duration: 0.3 }
              : { duration: 11, ease: "easeInOut", times: [0, 0.2, 0.45, 0.7, 0.88, 1], repeat: Infinity, repeatDelay: 0.6 }
          }
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={COVERS[(cover + 2) % COVERS.length]} alt="" className="h-full w-full object-cover" />
          {/* Camera cutout so it reads as a real case, not a flat panel. */}
          <span aria-hidden className="absolute right-4 top-4 h-9 w-9 rounded-xl border border-white/25 bg-black/40 backdrop-blur-sm" />
          <span aria-hidden className="absolute right-[26px] top-[26px] h-3 w-3 rounded-full bg-white/30" />
          {/* Edge light for physical depth. */}
          <span aria-hidden className="pointer-events-none absolute inset-0 rounded-[2.6rem] shadow-[inset_0_1px_2px_rgba(255,255,255,0.4)]" />
        </motion.div>
      </motion.div>
    </div>
  );
}
