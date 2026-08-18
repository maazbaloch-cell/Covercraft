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
 * AuthShowcase — the cinematic side-panel for the /account front door.
 *
 * A code-only "person presenting a phone" scene: an elegant continuous
 * line-art figure holds up a device whose cover art cycles, wrapped in the
 * brand's violet aurora with floating cover chips, ambient particles and a
 * subtle pointer parallax. NO external assets — every pixel is CSS/SVG so it
 * ships today; a real photo/video can replace it later without touching auth.
 *
 * Desktop-only (`hidden lg:block`) so mobile stays form-first. Fully gated on
 * prefers-reduced-motion: the draw-in, float, cover-cycle and parallax all go
 * static, leaving a clean composed frame.
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

// How many brand-palette cover faces the held phone cycles through.
const COVERS = 4;

// Deterministic (no Math.random → no hydration drift) ambient particles.
const PARTICLES = [
  { x: 64, y: 96, r: 3, delay: 0, dur: 7 },
  { x: 372, y: 132, r: 2.4, delay: 0.8, dur: 8.5 },
  { x: 96, y: 392, r: 2.8, delay: 1.6, dur: 7.8 },
  { x: 356, y: 428, r: 3.4, delay: 0.4, dur: 9 },
  { x: 220, y: 60, r: 2, delay: 1.2, dur: 6.6 },
  { x: 300, y: 300, r: 2.2, delay: 2, dur: 8 },
];

export default function AuthShowcase({ mode }: { mode: Mode }) {
  const reduce = useReducedMotion();
  const [cover, setCover] = useState(0);
  const copy = COPY[mode];

  // Cycle the phone's cover art (held still for reduced motion).
  useEffect(() => {
    if (reduce) return;
    const id = setInterval(() => setCover((c) => (c + 1) % COVERS), 2600);
    return () => clearInterval(id);
  }, [reduce]);

  // Pointer parallax — normalised [-1,1] from centre, spring-smoothed, fanned
  // across depth layers. Values stay at 0 for reduced motion (handlers unbound).
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 110, damping: 18, mass: 0.4 });
  const sy = useSpring(my, { stiffness: 110, damping: 18, mass: 0.4 });
  const orbX = useTransform(sx, (v) => v * 10);
  const orbY = useTransform(sy, (v) => v * 10);
  const figureX = useTransform(sx, (v) => v * 20);
  const figureY = useTransform(sy, (v) => v * 20);

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
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.9, ease: EASE_CINEMATIC }}
      className="relative hidden min-h-[34rem] overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-accent-800/40 via-ink-850 to-ink-950 shadow-depth-lg lg:block"
    >
      {/* Ambient wash + pulsing glow orbs (parallax back layer). */}
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-aurora opacity-80 animate-aurora-drift" />
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-grain opacity-[0.14]" />
      <motion.div
        aria-hidden
        style={{ x: orbX, y: orbY }}
        className="pointer-events-none absolute -left-10 top-8 h-52 w-52 rounded-full bg-accent-600/30 blur-3xl animate-pulse-glow"
      />
      <motion.div
        aria-hidden
        style={{ x: orbX, y: orbY }}
        className="pointer-events-none absolute -right-12 bottom-10 h-56 w-56 rounded-full bg-sky-500/20 blur-3xl animate-pulse-glow"
      />

      {/* The figure scene (parallax mid layer + gentle whole-scene float). */}
      <motion.div style={{ x: figureX, y: figureY }} className="absolute inset-0 flex items-center justify-center">
        <motion.div
          animate={reduce ? undefined : { y: [0, -10, 0] }}
          transition={reduce ? undefined : { duration: 7, ease: "easeInOut", repeat: Infinity }}
          className="w-[78%] max-w-[360px]"
        >
          <FigureScene cover={cover} reduce={!!reduce} />
        </motion.div>
      </motion.div>

      {/* Copy overlay (crossfades with the auth mode). */}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink-950 via-ink-950/70 to-transparent p-8 pt-16">
        <AnimatePresence mode="wait">
          <motion.div
            key={mode}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: DUR.base, ease: EASE_OUT_EXPO }}
          >
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-accent-300">{copy.eyebrow}</p>
            <h2 className="mt-2 max-w-sm font-display text-2xl font-black leading-tight tracking-cinema text-white">
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
 * The SVG scene: line-art figure + held phone + floating cover chips.
 * ------------------------------------------------------------------ */
function FigureScene({ cover, reduce }: { cover: number; reduce: boolean }) {
  return (
    <svg viewBox="0 0 440 560" fill="none" className="h-auto w-full drop-shadow-[0_18px_40px_rgba(124,58,237,0.28)]">
      <defs>
        <linearGradient id="strokeGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#c4b5fd" />
          <stop offset="55%" stopColor="#a78bfa" />
          <stop offset="100%" stopColor="#7c3aed" />
        </linearGradient>
        <radialGradient id="haloGrad" cx="50%" cy="42%" r="55%">
          <stop offset="0%" stopColor="rgb(124 58 237 / 0.45)" />
          <stop offset="100%" stopColor="rgb(124 58 237 / 0)" />
        </radialGradient>
        <linearGradient id="cover-0" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#38bdf8" />
        </linearGradient>
        <linearGradient id="cover-1" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#7c3aed" />
          <stop offset="100%" stopColor="#ec4899" />
        </linearGradient>
        <linearGradient id="cover-2" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#6d28d9" />
          <stop offset="100%" stopColor="#22d3ee" />
        </linearGradient>
        <linearGradient id="cover-3" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#a78bfa" />
          <stop offset="100%" stopColor="#f0abfc" />
        </linearGradient>
      </defs>

      {/* Focal halo behind the figure. */}
      <circle cx="205" cy="240" r="205" fill="url(#haloGrad)" />

      {/* Ambient particles. */}
      {PARTICLES.map((p, i) => (
        <motion.circle
          key={i}
          cx={p.x}
          cy={p.y}
          r={p.r}
          fill="#c4b5fd"
          initial={{ opacity: 0 }}
          animate={reduce ? { opacity: 0.5 } : { opacity: [0.2, 0.75, 0.2], y: [0, -12, 0] }}
          transition={reduce ? { duration: 0.4 } : { duration: p.dur, ease: "easeInOut", repeat: Infinity, delay: p.delay }}
        />
      ))}

      {/* ---- Line-art figure (continuous elegant strokes, flowing hair). ---- */}
      <g stroke="url(#strokeGrad)" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
        {/* Flowing hair — frames the head, sweeps down both sides. */}
        <Stroke d="M150 138 C165 96 212 98 226 138" delay={0.05} reduce={reduce} />
        <Stroke d="M150 138 C120 186 130 300 150 360" delay={0.12} reduce={reduce} />
        <Stroke d="M226 138 C256 190 250 316 231 380" delay={0.18} reduce={reduce} />
        {/* Head. */}
        <Stroke d="M226 128 a38 38 0 1 0 -76 0 a38 38 0 1 0 76 0" delay={0.24} reduce={reduce} />
        {/* Neck. */}
        <Stroke d="M188 166 L188 196" delay={0.3} reduce={reduce} />
        {/* Shoulder line rising into the raised arm. */}
        <Stroke d="M140 220 C165 200 214 198 248 216" delay={0.34} reduce={reduce} />
        {/* Torso / dress silhouette. */}
        <Stroke d="M152 226 C150 300 158 400 172 468" delay={0.4} reduce={reduce} />
        <Stroke d="M236 224 C246 300 240 392 224 468" delay={0.46} reduce={reduce} />
        <Stroke d="M172 468 C190 486 206 486 224 468" delay={0.52} reduce={reduce} />
        {/* Raised arm: shoulder → elbow → wrist → hand cupping the phone. */}
        <Stroke d="M248 216 C270 206 286 200 296 194" delay={0.58} reduce={reduce} />
        <Stroke d="M296 194 C300 182 300 170 300 160" delay={0.64} reduce={reduce} />
        <Stroke d="M300 160 C307 166 314 170 320 172" delay={0.7} reduce={reduce} />
      </g>

      {/* ---- The held phone (the product hero) — statically tilted; entrance +
             cover-cycle animate on the inner group so the rotation never fights
             the animated transforms. ---- */}
      <g transform="rotate(-9 335 129)">
        <motion.g
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: DUR.slow, ease: EASE_CINEMATIC, delay: reduce ? 0 : 0.8 }}
        >
          {/* Body. */}
          <rect x="305" y="70" width="60" height="118" rx="14" fill="#0a0b12" stroke="url(#strokeGrad)" strokeWidth={2.5} />
          {/* Screen base. */}
          <rect x="311" y="82" width="48" height="94" rx="9" fill="#050609" />
          {/* Cycling cover face. */}
          <AnimatePresence>
            <motion.rect
              key={cover}
              x="311"
              y="82"
              width="48"
              height="94"
              rx="9"
              fill={`url(#cover-${cover})`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.9, ease: EASE_CINEMATIC }}
            />
          </AnimatePresence>
          {/* Sheen sweep — a plain rect translated by its wrapping group. */}
          {!reduce && (
            <motion.g animate={{ x: [0, 30, 0] }} transition={{ duration: 5.2, ease: "easeInOut", repeat: Infinity, repeatDelay: 1.4 }}>
              <rect x="311" y="82" width="15" height="94" fill="#ffffff" opacity={0.14} />
            </motion.g>
          )}
          {/* Bezel highlight + camera. */}
          <rect x="311" y="82" width="48" height="94" rx="9" fill="none" stroke="#ffffff" strokeOpacity={0.12} />
          <circle cx="335" cy="78" r="2.2" fill="#c4b5fd" />
        </motion.g>
      </g>

      {/* ---- Floating mini cover chips (depth accents). ---- */}
      <FloatingChip x={68} y={200} rotate={-14} fill="url(#cover-1)" delay={0.9} dur={6.4} reduce={reduce} />
      <FloatingChip x={332} y={312} rotate={12} fill="url(#cover-2)" delay={1.3} dur={7.2} reduce={reduce} />
    </svg>
  );
}

/** A single draw-in line-art stroke (static full path under reduced motion). */
function Stroke({ d, delay, reduce }: { d: string; delay: number; reduce: boolean }) {
  if (reduce) return <path d={d} />;
  return (
    <motion.path
      d={d}
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{ pathLength: 1, opacity: 1 }}
      transition={{
        pathLength: { duration: 1.1, ease: EASE_CINEMATIC, delay },
        opacity: { duration: 0.3, delay },
      }}
    />
  );
}

/** A small floating cover chip. Static rotation lives on the outer <g> so the
 *  inner <motion.g> is free to animate opacity + a bob without transform clash. */
function FloatingChip({
  x,
  y,
  rotate,
  fill,
  delay,
  dur,
  reduce,
}: {
  x: number;
  y: number;
  rotate: number;
  fill: string;
  delay: number;
  dur: number;
  reduce: boolean;
}) {
  return (
    <g transform={`rotate(${rotate} ${x + 17} ${y + 24})`}>
      <motion.g
        initial={{ opacity: 0 }}
        animate={reduce ? { opacity: 1 } : { opacity: 1, y: [0, -14, 0] }}
        transition={
          reduce
            ? { duration: 0.4 }
            : { opacity: { duration: 0.5, delay }, y: { duration: dur, ease: "easeInOut", repeat: Infinity, delay } }
        }
      >
        <rect x={x} y={y} width="34" height="48" rx="8" fill={fill} opacity={0.9} />
        <rect x={x} y={y} width="34" height="48" rx="8" fill="none" stroke="#ffffff" strokeOpacity={0.18} />
      </motion.g>
    </g>
  );
}
