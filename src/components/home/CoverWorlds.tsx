"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import { EASE_CINEMATIC, EASE_SOFT_INOUT, DUR, cinematicReveal, lineStagger, lineChild, viewportOnce } from "@/lib/motion";
import { armSportsDive } from "@/lib/transition";
import Phone3D from "./Phone3D";

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
 * Sports scene's CTA additionally plays the Phase 6 Sports→Catalog single-shot:
 * an emerald "dive" curtain that covers the screen, then hands off to
 * CatalogArrival on /shop so the two routes read as one continuous camera move.
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
    accentText: "text-amber-300",
    chipRing: "border-amber-300/30",
    glow: "rgba(245,158,11,0.26)",
  },
  {
    index: "02",
    key: "gaming",
    name: "Gaming",
    tagline: "Enter the grid.",
    body: "Neon circuitry, cyber grids and reactive energy. Built for the ones who play to win — controlled, precise, unmistakable.",
    chips: ["Neon circuitry", "Cyber grid", "Reactive glow", "Matte grip"],
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
  const router = useRouter();
  const reduce = useReducedMotion();
  const [diving, setDiving] = useState(false);

  // Warm the catalog route so the dive lands on a ready page (the overlay hides
  // any remaining server round-trip on /shop, which is force-dynamic).
  useEffect(() => {
    router.prefetch("/shop");
  }, [router]);

  // Sports→Catalog single shot: cover the screen with the emerald dive, then
  // hand off to the catalog's arrival overlay across the navigation. Reduced
  // motion (or a modified click) skips straight to a normal navigation.
  const enterCatalog = () => {
    if (reduce) {
      router.push("/shop");
      return;
    }
    setDiving(true);
  };

  // Fire the navigation once the dive has fully covered the screen. Arming the
  // handoff flag immediately before push lets /shop start already-covered.
  const onDiveCovered = () => {
    armSportsDive();
    router.push("/shop");
  };

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
        <WorldScene
          key={world.key}
          world={world}
          flip={i % 2 === 1}
          onCta={world.key === "sports" ? enterCatalog : undefined}
        />
      ))}

      {/* Launch half of the Sports→Catalog single shot. */}
      <AnimatePresence>{diving && <SportsDiveCurtain onCovered={onDiveCovered} />}</AnimatePresence>
    </section>
  );
}

/* ------------------------------------------------------------------ *
 * A single world scene: themed backdrop + parallax phone + copy.
 * ------------------------------------------------------------------ */
function WorldScene({ world, flip, onCta }: { world: World; flip: boolean; onCta?: () => void }) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });

  // A world with an onCta (Sports) plays the cinematic dive instead of a plain
  // link — but only on an unmodified left click, so ⌘/ctrl/middle-click still
  // open /shop normally and the control stays a real, keyboard-navigable link.
  const handleCtaClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!onCta) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    onCta();
  };

  // Opposed parallax: backdrop sinks, phone rises, as the scene scrolls past.
  const backdropY = useTransform(scrollYProgress, [0, 1], reduce ? ["0%", "0%"] : ["-8%", "8%"]);
  const phoneY = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [60, -60]);
  const phoneRotate = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [flip ? 6 : -6, flip ? -6 : 6]);

  return (
    <div
      ref={ref}
      id={`world-${world.key}`}
      className="relative flex min-h-[100svh] w-full items-center py-24"
    >
      {/* Themed procedural backdrop (parallax) */}
      <motion.div style={{ y: backdropY }} aria-hidden className="pointer-events-none absolute inset-0 -z-10 scale-110">
        <WorldBackdrop world={world} reduce={!!reduce} />
      </motion.div>
      {/* No scrim / no overflow-hidden: a dark scrim per scene stacked into a
          periodic dark BAND between worlds (the reported "horizontal color
          line"), and clipping cut the parallax phone. The tints below are soft
          and edge-faded to transparent, so every world melts into the one
          shared fixed canvas — no boxes, no seams — while the phone stays free
          to drift without being cut. Copy stays legible on the dark base. */}

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
              onClick={handleCtaClick}
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
 * A realistic WebGL phone wearing this world's themed case (shared Phone3D),
 * with a gentle idle float. The scene's scroll-parallax wrapper still moves the
 * whole canvas, so the existing motion is preserved.
 * ------------------------------------------------------------------ */
function WorldPhone({ world }: { world: World }) {
  return (
    <Phone3D
      skin={world.key}
      idle
      className="h-[440px] w-[214px] sm:h-[500px] sm:w-[242px]"
    />
  );
}

/* ------------------------------------------------------------------ *
 * Full-scene backdrop art. TRANSPARENT base — every world layers its tint
 * ON TOP of the page's shared fixed canvas, and each tint is vertically
 * masked to fade to nothing at the scene's top & bottom edges, so worlds
 * dissolve into one another with no boxes and no horizontal seams.
 * ------------------------------------------------------------------ */

// Fade every world's art to transparent at the top & bottom of its scene so it
// melts into the continuous canvas above and below it.
const EDGE_FADE = {
  maskImage: "linear-gradient(to bottom, transparent, #000 14%, #000 86%, transparent)",
  WebkitMaskImage: "linear-gradient(to bottom, transparent, #000 14%, #000 86%, transparent)",
} as const;

function WorldBackdrop({ world, reduce }: { world: World; reduce: boolean }) {
  if (world.key === "art") {
    return (
      <div className="absolute inset-0" style={EDGE_FADE}>
        {/* Gallery light: warm gold + brand blue washes (no purple). */}
        <div
          className={`absolute inset-0 ${reduce ? "" : "animate-aurora-drift"}`}
          style={{
            background:
              "radial-gradient(40% 40% at 20% 30%, rgba(37,99,235,0.13), transparent 60%), radial-gradient(45% 45% at 80% 70%, rgba(96,165,250,0.10), transparent 60%), radial-gradient(35% 35% at 60% 15%, rgba(245,158,11,0.10), transparent 60%)",
          }}
        />
        {/* faint gold leaf streaks */}
        <div aria-hidden className="absolute inset-0 opacity-30" style={{ background: "repeating-linear-gradient(115deg, transparent 0 34px, rgba(245,158,11,0.10) 34px 35px, transparent 35px 60px)" }} />
      </div>
    );
  }
  if (world.key === "gaming") {
    return (
      <div className="absolute inset-0" style={EDGE_FADE}>
        {/* Wide perspective grid */}
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 top-1/2 origin-bottom opacity-25"
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
          style={{ background: "radial-gradient(50% 40% at 50% 30%, rgba(34,211,238,0.12), transparent 60%), radial-gradient(40% 30% at 78% 60%, rgba(37,99,235,0.13), transparent 60%)" }}
        />
      </div>
    );
  }
  return (
    <div className="absolute inset-0" style={EDGE_FADE}>
      <div
        aria-hidden
        className="absolute inset-0 opacity-30"
        style={{ background: "repeating-linear-gradient(58deg, transparent 0 40px, rgba(16,185,129,0.10) 40px 44px, transparent 44px 90px)" }}
      />
      <div
        aria-hidden
        className="absolute inset-0"
        style={{ background: "radial-gradient(45% 40% at 25% 25%, rgba(16,185,129,0.13), transparent 60%), radial-gradient(45% 40% at 78% 75%, rgba(163,230,53,0.10), transparent 60%)" }}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * SportsDiveCurtain — the launch half of the Sports→Catalog single shot.
 *
 * A full-screen emerald "dive into the grid": the energy field rushes up from
 * the center while the 58° speed streaks accelerate, ending fully covering the
 * viewport. onCovered fires at that peak so navigation happens behind an opaque
 * screen; the curtain then holds (it unmounts with the page) while /shop loads,
 * and CatalogArrival continues the move from the same covered state.
 * ------------------------------------------------------------------ */
function SportsDiveCurtain({ onCovered }: { onCovered: () => void }) {
  return (
    <motion.div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[120] overflow-hidden bg-[#04120c]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.28, ease: EASE_SOFT_INOUT }}
    >
      {/* Energy field rushing up from the grid. onCovered fires when this — the
          slowest layer — finishes, i.e. once the screen is fully covered. */}
      <motion.div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 55% at 50% 62%, rgba(16,185,129,0.6), transparent 60%), radial-gradient(45% 40% at 78% 80%, rgba(163,230,53,0.45), transparent 60%)",
        }}
        initial={{ opacity: 0.4, scale: 0.25, y: "30%" }}
        animate={{ opacity: 1, scale: 1.4, y: "0%" }}
        transition={{ duration: 0.62, ease: EASE_CINEMATIC }}
        onAnimationComplete={onCovered}
      />
      {/* Accelerating speed streaks. */}
      <motion.div
        className="absolute inset-0"
        style={{
          background:
            "repeating-linear-gradient(58deg, transparent 0 16px, rgba(255,255,255,0.12) 16px 18px, transparent 18px 30px)",
        }}
        initial={{ opacity: 0, scale: 1 }}
        animate={{ opacity: 0.8, scale: 1.2 }}
        transition={{ duration: 0.5, ease: EASE_CINEMATIC }}
      />
      {/* Center flash blooming at the peak of the dive. */}
      <motion.div
        className="absolute inset-0"
        style={{ background: "radial-gradient(28% 28% at 50% 55%, rgba(236,253,245,0.95), transparent 70%)" }}
        initial={{ opacity: 0, scale: 0.3 }}
        animate={{ opacity: 0.85, scale: 1.6 }}
        transition={{ duration: 0.6, ease: EASE_CINEMATIC, delay: 0.08 }}
      />
    </motion.div>
  );
}
