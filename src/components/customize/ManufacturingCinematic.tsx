"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useReducedMotion, motion, AnimatePresence } from "framer-motion";

/**
 * ManufacturingCinematic — a real filmed, 4K-sourced industrial FACTORY movie
 * for the Custom Cover Studio banner. It plays licensed live-action footage
 * (Pexels License: free for commercial use, no attribution, non-copyrighted)
 * sequenced into one continuous manufacturing documentary: the viewer should
 * feel a camera crew is walking a real production line where covers are made.
 *
 * This is deliberately NOT a product ad — there is no phone, no cover hero
 * shot, no "made for you" reveal. The hierarchy is FACTORY ▸ MACHINERY ▸
 * PROCESS ▸ PRODUCTION ▸ QUALITY. The film opens wide on the factory floor,
 * pushes through the machines and the printing/QC stages, and ends back on the
 * active production line (a "pull back", then a soft crossfade that loops).
 *
 * The clips were trimmed/downscaled/stripped locally into /public/customize as
 * desktop (…-1080.mp4) + mobile (…-720.mp4) + poster (….jpg). Colour is kept
 * REALISTIC — only a whisper of contrast is baked in; the footage is NOT blue-
 * tinted. Just light edge vignettes seat the video in the dark page (no heavy
 * filter, no hard seams). A view transfers a few MB, never 4K.
 *
 * Shot order (loops): wide establish ▸ precision machinery ▸ print head ▸
 * printing the cover ▸ press rollers ▸ covers on the line ▸ quality control ▸
 * active production line. Honors prefers-reduced-motion (static factory frame).
 */

type BeatKey = "establish" | "machine" | "printhead" | "printer" | "press" | "covers" | "inspect" | "line";

const BEATS: { key: BeatKey; kicker: string; line: string }[] = [
  { key: "establish", kicker: "Inside the factory", line: "Where every cover is made." },
  { key: "machine", kicker: "Precision machinery", line: "Robotic systems handle each part." },
  { key: "printhead", kicker: "Printing", line: "The design is applied to the surface." },
  { key: "printer", kicker: "On the machine", line: "Media feeds through the printer." },
  { key: "press", kicker: "Precision rollers", line: "Exact alignment, every pass." },
  { key: "covers", kicker: "In volume", line: "Covers move down the production line." },
  { key: "inspect", kicker: "Quality control", line: "Every cover is inspected." },
  { key: "line", kicker: "Production line", line: "This is how your custom cover is made." },
];

const src = (beat: BeatKey, res: "1080" | "720") => `/customize/${beat}-${res}.mp4`;
const poster = (beat: BeatKey) => `/customize/${beat}.jpg`;

/**
 * Light seam-blending overlays — NO blue veil. The footage keeps its real
 * factory colours; these only seat the video in the dark page and keep the
 * caption legible.
 */
function Grade() {
  return (
    <>
      {/* faint top scrim for caption legibility */}
      <div className="absolute inset-x-0 top-0 h-1/4" style={{ background: "linear-gradient(180deg,rgba(4,6,13,0.42),transparent)" }} />
      {/* bottom vignette → melts into the dark page (no hard seam) */}
      <div className="absolute inset-x-0 bottom-0 h-2/5" style={{ background: "linear-gradient(180deg,transparent,rgba(4,6,13,0.94))" }} />
      {/* soft inner frame so the clip sits inside the banner rather than butting the edges */}
      <div className="absolute inset-0" style={{ boxShadow: "inset 0 0 120px rgba(4,6,13,0.55)" }} />
    </>
  );
}

export default function ManufacturingCinematic({ className = "" }: { className?: string }) {
  const reduce = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [idx, setIdx] = useState(0);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    const m = window.matchMedia("(max-width: 640px)");
    const on = () => setMobile(m.matches);
    on();
    m.addEventListener("change", on);
    return () => m.removeEventListener("change", on);
  }, []);

  const beat = BEATS[idx % BEATS.length];
  const res = mobile ? "720" : "1080";
  const still = !!reduce;

  const advance = () => setIdx((i) => (i + 1) % BEATS.length);

  const dots = useMemo(() => BEATS.map((b, i) => ({ b, on: i === idx % BEATS.length })), [idx]);

  return (
    <div aria-hidden className={`overflow-hidden bg-ink-950 ${className}`}>
      {/* ---- Footage layer ---- */}
      {!mounted || still ? (
        // Static, high-quality factory frame (SSR placeholder + reduced-motion)
        <div className="absolute inset-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={poster("establish")} alt="" className="h-full w-full object-cover" />
        </div>
      ) : (
        <AnimatePresence>
          <motion.div
            key={idx}
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.9, ease: "easeInOut" }}
          >
            <motion.video
              ref={videoRef}
              className="h-full w-full object-cover"
              src={src(beat.key, res)}
              poster={poster(beat.key)}
              autoPlay
              muted
              playsInline
              preload="auto"
              onEnded={advance}
              onError={advance}
              onCanPlay={(e) => {
                const v = e.currentTarget;
                const p = v.play();
                if (p && typeof p.catch === "function") p.catch(() => {});
              }}
              initial={{ scale: 1.03 }}
              animate={{ scale: 1.1 }}
              transition={{ duration: 9, ease: "linear" }}
            />
          </motion.div>
        </AnimatePresence>
      )}

      {/* ---- Seam blend (no blue veil) ---- */}
      <Grade />

      {/* ---- Scene caption (the manufacturing steps) ---- */}
      {!still && (
        <div className="pointer-events-none absolute inset-x-0 bottom-3 z-30 flex flex-col items-center gap-2">
          <AnimatePresence mode="wait">
            <motion.div
              key={beat.key}
              className="flex items-center gap-2 rounded-full border border-white/10 bg-black/30 px-4 py-1.5 backdrop-blur-md"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.4 }}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-accent-400" />
              <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-accent-200">{beat.kicker}</span>
              <span className="hidden text-xs text-slate-200 sm:inline">{beat.line}</span>
            </motion.div>
          </AnimatePresence>

          {/* film-progress dots */}
          <div className="flex items-center gap-1.5">
            {dots.map((d, i) => (
              <span
                key={i}
                className={`h-1 rounded-full transition-all duration-500 ${d.on ? "w-4 bg-accent-400" : "w-1.5 bg-white/25"}`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
