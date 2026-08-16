"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import { EASE_CINEMATIC, DUR, cinematicReveal, lineStagger, lineChild, viewportOnce } from "@/lib/motion";

/**
 * CoverWorlds — the three cover worlds (Phase 5).
 *
 * Deepens the Phase 3 teaser into three immersive, full-height scenes — Art,
 * Gaming, Sports — each with a distinct PROCEDURAL identity (CSS-only art, no
 * external assets): a themed backdrop, a phone wearing that world's design
 * language, staggered copy and vibe chips. This is the EXPLORE beat.
 *
 * The worlds are a brand-narrative device, not DB categories (real categories
 * are phone models / styles), so every world links to the full /shop. The
 * Sports scene is the seed for Phase 6's Sports→Catalog single-shot transition.
 *
 * Each scene gets a subtle scroll-parallax (backdrop and phone drift in
 * opposite directions) driven by its own useScroll → useTransform. All of it is
 * gated on prefers-reduced-motion, which yields calm, static scenes.
 */

interface World {
  index: string;
  key: "art" | "gaming" | "sports";
  name: string;
  tagline: string;
  body: string;
  chips: readonly string[];
  cta: string;
  href: string;
  accentText: string; // tailwind text color for eyebrow/accents
  chipRing: string; // tailwind border color for chips
  glow: string; // rgba used for ambient glow behind the phone
}

const WORLDS: readonly World[] = [
  {
    index: "01",
    key: "art",
    name: "Art",
    tagline: "Wear a gallery.",
    body: "Marble veined with gold, painterly gradients and floral bloom. Covers that treat your phone like a canvas worth framing.",
    chips: ["Marble & stone", "Painterly gradients", "Floral bloom", "Gold leaf"],
    cta: "Explore Art",
    href: "/shop",
    accentText: "text-fuchsia-300",
    chipRing: "border-fuchsia-300/30",
    glow: "rgba(217,70,239,0.30)",
  },
  {
    index: "02",
    key: "gaming",
    name: "Gaming",
    tagline: "Enter the grid.",
    body: "Neon circuitry, cyber grids and reactive energy. Built for the ones who play to win — loud, electric, unmistakable.",
    chips: ["Neon circuitry", "Cyber grid", "RGB energy", "Matte grip"],
    cta: "Explore Gaming",
    href: "/shop",
    accentText: "text-cyan-300",
    chipRing: "border-cyan-300/30",
    glow: "rgba(34,211,238,0.28)",
  },
  {
    index: "03",
    key: "sports",
    name: "Sports",
    tagline: "Made for motion.",
    body: "Speed streaks, team colours and the thrill of the play. Covers with kinetic energy — for the ones who never sit still.",
    chips: ["Team colours", "Kinetic streaks", "Bold numerals", "All-grip"],
    cta: "Enter the catalog",
    href: "/shop",
    accentText: "text-emerald-300",
    chipRing: "border-emerald-300/30",
    glow: "rgba(16,185,129,0.28)",
  },
] as const;

export default function CoverWorlds() {
  return (
    <section aria-labelledby="worlds-heading" className="relative w-full">
      {/* Intro */}
      <div className="mx-auto w-full max-w-[var(--cinema-max)] px-6 pt-24 text-center sm:pt-28">
        <motion.p variants={cinematicReveal} initial="hidden" whileInView="show" viewport={viewportOnce} className="text-[11px] font-bold uppercase tracking-[0.28em] text-accent-400">
          Explore
        </motion.p>
        <motion.h2
          id="worlds-heading"
          variants={cinematicReveal}
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
          className="mt-3 font-display text-3xl font-bold tracking-cinema text-white sm:text-5xl"
        >
          Three worlds to get lost in
        </motion.h2>
        <motion.p variants={cinematicReveal} initial="hidden" whileInView="show" viewport={viewportOnce} className="mx-auto mt-4 max-w-md text-base leading-7 text-slate-300">
          Every cover belongs to a world. Find yours.
        </motion.p>
      </div>

      {WORLDS.map((world, i) => (
        <WorldScene key={world.key} world={world} flip={i % 2 === 1} />
      ))}
    </section>
  );
}

/* ------------------------------------------------------------------ *
 * A single world scene: themed backdrop + parallax phone + copy.
 * ------------------------------------------------------------------ */
function WorldScene({ world, flip }: { world: World; flip: boolean }) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });

  // Opposed parallax: backdrop sinks, phone rises, as the scene scrolls past.
  const backdropY = useTransform(scrollYProgress, [0, 1], reduce ? ["0%", "0%"] : ["-8%", "8%"]);
  const phoneY = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [60, -60]);
  const phoneRotate = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [flip ? 6 : -6, flip ? -6 : 6]);

  return (
    <div
      ref={ref}
      id={`world-${world.key}`}
      className="relative flex min-h-screen w-full items-center overflow-hidden py-24"
    >
      {/* Themed procedural backdrop (parallax) */}
      <motion.div style={{ y: backdropY }} aria-hidden className="pointer-events-none absolute inset-0 -z-10 scale-110">
        <WorldBackdrop world={world} reduce={!!reduce} />
      </motion.div>
      {/* Legibility scrims top & bottom so copy always reads */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-ink-950/70 via-transparent to-ink-950/80" />

      <div className="mx-auto grid w-full max-w-[var(--cinema-max)] items-center gap-10 px-6 lg:grid-cols-2 lg:gap-8">
        {/* Copy */}
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
          variants={lineStagger}
          className={`relative z-10 text-center lg:text-left ${flip ? "lg:order-2" : "lg:order-1"}`}
        >
          <motion.p variants={lineChild} className={`text-[11px] font-bold uppercase tracking-[0.3em] ${world.accentText}`}>
            World {world.index} — {world.name}
          </motion.p>
          <motion.h3 variants={lineChild} className="mt-4 font-display text-5xl font-bold leading-[0.98] tracking-cinema text-white sm:text-6xl">
            {world.tagline}
          </motion.h3>
          <motion.p variants={lineChild} className="mx-auto mt-5 max-w-md text-base leading-7 text-slate-300 lg:mx-0">
            {world.body}
          </motion.p>
          <motion.ul variants={lineChild} className="mt-6 flex flex-wrap justify-center gap-2 lg:justify-start">
            {world.chips.map((chip) => (
              <li key={chip} className={`rounded-full border ${world.chipRing} bg-white/5 px-3 py-1 text-xs font-semibold text-slate-200`}>
                {chip}
              </li>
            ))}
          </motion.ul>
          <motion.div variants={lineChild} className="mt-8 flex justify-center lg:justify-start">
            <Link
              href={world.href}
              className="group inline-flex items-center gap-2 rounded-full bg-white/10 px-6 py-3 text-sm font-bold text-white ring-1 ring-inset ring-white/20 backdrop-blur transition-colors duration-200 hover:bg-white/20"
            >
              {world.cta}
              <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </Link>
          </motion.div>
        </motion.div>

        {/* Phone wearing this world's design language */}
        <div className={`relative z-10 flex items-center justify-center ${flip ? "lg:order-1" : "lg:order-2"}`}>
          <motion.div
            style={{ y: phoneY, rotate: phoneRotate }}
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={viewportOnce}
            transition={{ duration: DUR.slow, ease: EASE_CINEMATIC }}
            className="will-cinema relative"
          >
            <div aria-hidden className="pointer-events-none absolute -inset-10 -z-10 rounded-full blur-3xl" style={{ background: world.glow }} />
            <WorldPhone world={world} />
          </motion.div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * A phone frame whose cover face is procedural, themed per world.
 * ------------------------------------------------------------------ */
function WorldPhone({ world }: { world: World }) {
  return (
    <div className="relative h-[440px] w-[220px] rounded-[2.5rem] border border-white/15 bg-gradient-to-b from-white/10 to-white/[0.02] p-2.5 shadow-depth-lg sm:h-[500px] sm:w-[250px]">
      <div className="relative h-full w-full overflow-hidden rounded-[2rem]">
        <WorldCoverFace world={world} />
        {/* Sheen */}
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent" />
        {/* Camera module */}
        <div className="absolute left-4 top-4 flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-2xl border border-white/15 bg-black/40 backdrop-blur-sm">
          <div className="grid grid-cols-2 gap-1.5">
            <span className="h-5 w-5 rounded-full bg-ink-950 ring-2 ring-white/10" />
            <span className="h-5 w-5 rounded-full bg-ink-950 ring-2 ring-white/10" />
            <span className="h-5 w-5 rounded-full bg-ink-950 ring-2 ring-white/10" />
            <span className="h-5 w-5 rounded-full bg-white/20 ring-2 ring-white/10" />
          </div>
        </div>
        <span className="absolute bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-black uppercase tracking-[0.3em] text-white/60">
          CoverCraft
        </span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Procedural cover faces — the design language of each world (CSS only).
 * ------------------------------------------------------------------ */
function WorldCoverFace({ world }: { world: World }) {
  if (world.key === "art") {
    return (
      <div className="absolute inset-0">
        {/* Marble base: warm ivory with veining */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "conic-gradient(from 210deg at 30% 25%, #fdf4ff, #f5d0fe 20%, #e9d5ff 42%, #fbcfe8 63%, #fde68a 82%, #fdf4ff)",
          }}
        />
        {/* Gold veins */}
        <div
          aria-hidden
          className="absolute inset-0 opacity-70 mix-blend-overlay"
          style={{
            background:
              "radial-gradient(60% 40% at 70% 20%, rgba(202,138,4,0.55), transparent 60%), radial-gradient(50% 45% at 20% 80%, rgba(217,70,239,0.4), transparent 60%)",
          }}
        />
        <div
          aria-hidden
          className="absolute inset-0 opacity-60"
          style={{
            background:
              "repeating-linear-gradient(115deg, transparent 0 22px, rgba(180,120,20,0.18) 22px 23px, transparent 23px 40px)",
          }}
        />
      </div>
    );
  }

  if (world.key === "gaming") {
    return (
      <div className="absolute inset-0 bg-[#05070f]">
        {/* Neon perspective grid floor */}
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 top-1/3 origin-bottom opacity-80"
          style={{
            backgroundImage:
              "linear-gradient(rgba(34,211,238,0.55) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,0.55) 1px, transparent 1px)",
            backgroundSize: "26px 26px",
            transform: "perspective(340px) rotateX(62deg)",
            maskImage: "linear-gradient(to bottom, transparent, #000 55%)",
            WebkitMaskImage: "linear-gradient(to bottom, transparent, #000 55%)",
          }}
        />
        {/* Neon horizon glow */}
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(70% 40% at 50% 42%, rgba(34,211,238,0.35), transparent 60%), radial-gradient(50% 30% at 75% 22%, rgba(232,121,249,0.35), transparent 60%)",
          }}
        />
        {/* Scanlines */}
        <div
          aria-hidden
          className="absolute inset-0 opacity-30"
          style={{ background: "repeating-linear-gradient(0deg, rgba(255,255,255,0.08) 0 1px, transparent 1px 4px)" }}
        />
      </div>
    );
  }

  // sports
  return (
    <div className="absolute inset-0 bg-[#04120c]">
      {/* Energy field */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 50% at 30% 20%, rgba(16,185,129,0.45), transparent 60%), radial-gradient(55% 45% at 80% 80%, rgba(163,230,53,0.4), transparent 60%)",
        }}
      />
      {/* Diagonal speed streaks */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-70"
        style={{
          background:
            "repeating-linear-gradient(58deg, transparent 0 16px, rgba(255,255,255,0.10) 16px 18px, transparent 18px 30px)",
        }}
      />
      {/* Bold numeral */}
      <span className="absolute inset-0 flex items-center justify-center font-display text-[9rem] font-bold leading-none text-white/15">
        09
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Full-scene backdrop art (behind the whole world section).
 * ------------------------------------------------------------------ */
function WorldBackdrop({ world, reduce }: { world: World; reduce: boolean }) {
  if (world.key === "art") {
    return (
      <div className="absolute inset-0 bg-ink-950">
        <div
          className={`absolute inset-0 ${reduce ? "" : "animate-aurora-drift"}`}
          style={{
            background:
              "radial-gradient(40% 40% at 20% 30%, rgba(217,70,239,0.22), transparent 60%), radial-gradient(45% 45% at 80% 70%, rgba(168,85,247,0.20), transparent 60%), radial-gradient(35% 35% at 60% 15%, rgba(251,191,36,0.14), transparent 60%)",
          }}
        />
      </div>
    );
  }
  if (world.key === "gaming") {
    return (
      <div className="absolute inset-0 bg-[#03040a]">
        {/* Wide perspective grid */}
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 top-1/2 origin-bottom opacity-40"
          style={{
            backgroundImage:
              "linear-gradient(rgba(34,211,238,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,0.5) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
            transform: "perspective(700px) rotateX(70deg)",
            maskImage: "linear-gradient(to bottom, transparent, #000 60%)",
            WebkitMaskImage: "linear-gradient(to bottom, transparent, #000 60%)",
          }}
        />
        <div
          aria-hidden
          className="absolute inset-0"
          style={{ background: "radial-gradient(50% 40% at 50% 30%, rgba(34,211,238,0.18), transparent 60%), radial-gradient(40% 30% at 78% 60%, rgba(232,121,249,0.16), transparent 60%)" }}
        />
      </div>
    );
  }
  return (
    <div className="absolute inset-0 bg-[#03100a]">
      <div
        aria-hidden
        className="absolute inset-0 opacity-50"
        style={{ background: "repeating-linear-gradient(58deg, transparent 0 40px, rgba(16,185,129,0.10) 40px 44px, transparent 44px 90px)" }}
      />
      <div
        aria-hidden
        className="absolute inset-0"
        style={{ background: "radial-gradient(45% 40% at 25% 25%, rgba(16,185,129,0.20), transparent 60%), radial-gradient(45% 40% at 78% 75%, rgba(163,230,53,0.16), transparent 60%)" }}
      />
    </div>
  );
}
