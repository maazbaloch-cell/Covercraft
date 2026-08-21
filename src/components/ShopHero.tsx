"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import Phone3D from "@/components/home/Phone3D";
import { staggerContainer, lineChild, DUR, EASE_OUT_EXPO } from "@/lib/motion";

/**
 * ShopHero — a high-end product-commercial hero for the Shop/Catalog page.
 *
 * A REAL (WebGL) flagship phone (the shared <Phone3D>, titanium frame + glass
 * back + detailed camera module, studio-lit with contact shadows) stands upright
 * in a physical dock/stand, wrapped by a slowly rotating ring structure with a
 * soft light travelling around it and a cinematic light sweep drifting across the
 * whole composition. Everything loops on different durations so it feels filmed,
 * not mechanically animated; the copy reveals with a staggered fade-up and then
 * holds still. One continuous dark environment — no boxed sections or seams.
 *
 * Reduced motion: <Phone3D> falls back to a static CSS device, all CSS loops are
 * frozen globally, and the scroll transforms below are gated to identity.
 */
export default function ShopHero() {
  const heroRef = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();

  // Subtle, controlled scroll response — the composition settles as the hero
  // leaves; nothing "flies away". Gated to identity under reduced motion.
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const copyY = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : -40]);
  const stageY = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : 70]);
  const phoneScale = useTransform(scrollYProgress, [0, 1], [1, reduce ? 1 : 1.06]);
  const ringScale = useTransform(scrollYProgress, [0, 1], [1, reduce ? 1 : 1.14]);
  const ringOpacity = useTransform(scrollYProgress, [0, 0.85], [1, reduce ? 1 : 0.35]);
  const sweepOpacity = useTransform(scrollYProgress, [0, 0.7], [1, reduce ? 1 : 0]);

  return (
    <section ref={heroRef} className="relative isolate overflow-hidden">
      {/* One local brand-blue pool that melts into the page's continuous aurora —
          soft radial, no hard edges, so there is no boxed section or seam. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10" style={{ background: "radial-gradient(58% 62% at 62% 42%, rgb(37 99 235 / 0.20), transparent 70%)" }} />

      <div className="mx-auto grid max-w-7xl items-center gap-10 px-6 py-16 md:grid-cols-2 md:py-24 lg:py-28">
        {/* ---- Copy: eyebrow → heading → description → CTA (staggered, then still) ---- */}
        <motion.div variants={staggerContainer} initial="hidden" animate="show" style={{ y: copyY }} className="relative z-10 order-2 md:order-1">
          <motion.p variants={lineChild} className="text-xs font-bold uppercase tracking-[.28em] text-accent-300">The CoverCraft edit · 2026</motion.p>
          <motion.h1 variants={lineChild} className="mt-5 font-display text-4xl font-black leading-[1.02] tracking-cinema text-white sm:text-6xl">
            Made to protect.<br /><span className="text-gradient">Designed to be seen.</span>
          </motion.h1>
          <motion.p variants={lineChild} className="mt-6 max-w-lg leading-7 text-slate-300">
            Premium mobile covers for the device you carry everywhere. Find a signature look without compromising protection.
          </motion.p>
          <motion.div variants={lineChild} className="mt-9 flex flex-wrap items-center gap-4">
            <motion.a
              href="#catalogue"
              whileHover={reduce ? undefined : { scale: 1.04, y: -2 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: DUR.micro, ease: EASE_OUT_EXPO }}
              className="group inline-flex items-center rounded-full bg-white px-7 py-3.5 text-sm font-bold text-ink-950 shadow-glow transition-shadow hover:shadow-glow-sm"
            >
              Shop the collection
              <span className="ml-2 transition-transform duration-200 group-hover:translate-x-1">→</span>
            </motion.a>
            <span className="text-sm text-slate-400">Free shipping · Easy returns</span>
          </motion.div>
        </motion.div>

        {/* ---- Visual stage: ring structure + realistic phone + dock stand ---- */}
        <motion.div style={{ y: stageY }} className="relative order-1 mx-auto aspect-square w-full max-w-[24rem] sm:max-w-[28rem] md:order-2 lg:max-w-[32rem]">
          {/* Ambient floor glow under the stand */}
          <div aria-hidden className="pointer-events-none absolute inset-x-[18%] bottom-[9%] -z-10 h-[16%] rounded-[50%] bg-accent-600/25 blur-2xl" />

          {/* Animated ring / structure — sits BEHIND the phone (never covers it). */}
          <motion.div aria-hidden style={{ scale: ringScale, opacity: ringOpacity }} className="pointer-events-none absolute inset-0 grid place-items-center">
            {/* Outer hairline ring */}
            <div className="absolute aspect-square w-[94%] rounded-full border border-white/10" />
            {/* Rotating soft light travelling along the outer ring (conic band, masked to a ring) */}
            <div
              className="absolute aspect-square w-[94%] rounded-full opacity-70"
              style={{
                background: "conic-gradient(from 0deg, transparent 0deg, transparent 250deg, rgba(96,165,250,0.55) 320deg, rgba(147,197,253,0.9) 350deg, transparent 360deg)",
                WebkitMaskImage: "radial-gradient(farthest-side, transparent calc(100% - 2px), #000 calc(100% - 2px))",
                maskImage: "radial-gradient(farthest-side, transparent calc(100% - 2px), #000 calc(100% - 2px))",
                animation: "shop-orbit 26s linear infinite",
              }}
            />
            {/* Middle ring — thin, slow reverse rotation with two glowing arc segments */}
            <div
              className="absolute aspect-square w-[76%] rounded-full border border-white/[0.07]"
              style={{ animation: "shop-orbit-rev 60s linear infinite" }}
            >
              <span className="absolute left-1/2 top-[-3px] h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-accent-300 shadow-[0_0_12px_2px_rgba(147,197,253,0.8)]" />
              <span className="absolute bottom-[-3px] left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-accent-400/80 shadow-[0_0_10px_2px_rgba(96,165,250,0.7)]" />
            </div>
            {/* Inner ring — faint, breathing */}
            <div className="absolute aspect-square w-[60%] rounded-full border border-white/[0.06]" style={{ animation: "shop-breathe 9s ease-in-out infinite" }} />
            {/* Orbiting accent node (slow, single — premium, not a particle field) */}
            <div className="absolute aspect-square w-[86%]" style={{ animation: "shop-orbit 44s linear infinite" }}>
              <span className="absolute left-1/2 top-0 h-2 w-2 -translate-x-1/2 rounded-full bg-white/90 shadow-[0_0_14px_3px_rgba(255,255,255,0.55)]" />
            </div>
          </motion.div>

          {/* Cinematic light sweep — a soft studio light drifting across the frame. */}
          <motion.div
            aria-hidden
            style={{ opacity: sweepOpacity }}
            className="pointer-events-none absolute inset-0 overflow-hidden rounded-[3rem]"
          >
            <motion.div
              animate={reduce ? undefined : { x: ["-60%", "60%"], opacity: [0, 0.9, 0] }}
              transition={{ duration: 11, ease: "easeInOut", repeat: Infinity, repeatDelay: 1.5 }}
              className="absolute -inset-y-1/4 left-1/4 w-1/2 -skew-x-[18deg] bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.10),transparent)] blur-md"
            />
          </motion.div>

          {/* The realistic phone — upright, gently floating, brand-blue glow.
              Neutral deep-navy/black cover (on-brand, reusable) — NOT orange. */}
          <motion.div style={{ scale: phoneScale }} className="absolute inset-x-[7%] bottom-[5%] top-[1%] z-10">
            <Phone3D skin="navy" idle glow baseYaw={-0.12} className="h-full w-full" />
          </motion.div>

          {/* ---- Physical dock stand (the phone stands in it) ---- */}
          <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-[7%] z-20 flex justify-center">
            <div className="relative w-[52%]">
              {/* Soft ground contact shadow */}
              <div className="absolute -bottom-3 left-1/2 h-6 w-[96%] -translate-x-1/2 rounded-[50%] bg-black/55 blur-xl" />
              {/* Reflection of the phone glass onto the stand's top surface */}
              <div className="absolute -top-6 left-1/2 h-8 w-[42%] -translate-x-1/2 rounded-[50%] bg-gradient-to-b from-white/15 to-transparent blur-[3px] opacity-60" />
              {/* Pedestal body — brushed dark metal with an edge highlight */}
              <div
                className="relative h-9 w-full rounded-[42%] border-t border-white/15"
                style={{ background: "linear-gradient(180deg,#20293c 0%,#131a2a 45%,#0a0e18 100%)", boxShadow: "0 14px 30px -10px rgba(0,0,0,0.7), inset 0 2px 3px rgba(255,255,255,0.12)" }}
              >
                {/* Top surface ellipse — catches the blue key light, holds the phone slot */}
                <div
                  className="absolute -top-2 left-1/2 h-4 w-[86%] -translate-x-1/2 rounded-[50%]"
                  style={{ background: "radial-gradient(60% 100% at 50% 30%, #2b3654, #141b2c 80%)", boxShadow: "inset 0 2px 4px rgba(0,0,0,0.6), 0 1px 0 rgba(255,255,255,0.18)" }}
                />
                {/* Brand-blue light catch on the front rim */}
                <div className="absolute inset-x-[15%] top-1 h-1 rounded-full bg-accent-500/40 blur-[2px]" />
              </div>
            </div>
          </div>

          {/* Subtle promo chip — kept, but quiet so the banner never crowds. */}
          <motion.span
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: DUR.base, ease: EASE_OUT_EXPO, delay: 0.7 }}
            className="absolute right-[2%] top-[12%] z-20 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-[0.68rem] font-black uppercase tracking-wider text-white backdrop-blur-md"
          >
            Up to 20% off
          </motion.span>
        </motion.div>
      </div>
    </section>
  );
}
