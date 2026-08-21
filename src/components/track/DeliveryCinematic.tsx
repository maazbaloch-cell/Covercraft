"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useReducedMotion, motion, AnimatePresence } from "framer-motion";

/**
 * DeliveryCinematic — a real filmed, 4K-sourced delivery "movie" for the Track
 * Order hero. It plays licensed live-action footage (Pexels License: free for
 * commercial use, no attribution, non-copyrighted) sequenced into one continuous
 * cinematic story and colour-graded to the CoverCraft BLUE + BLACK identity.
 *
 * The clips were downscaled/graded/stripped locally into /public/track as
 * desktop (…-1080.mp4) + mobile (…-720.mp4) + poster (….jpg). Only the beats for
 * the current status ever load (lazy), so a view transfers ~1–3 MB, never 4K.
 *
 * The film is driven by the REAL order status (never faked). Each status plays
 * its own segment of the same journey; before any lookup, the full 8-scene movie
 * loops as an ambient showcase:
 *
 *   (no order yet)   → ambient : 1 pack ▸ 2 arrive ▸ 3 load ▸ 4 depart ▸
 *                                5 road ▸ 6 road2 ▸ 7 dest ▸ 8 deliver (loops)
 *   PENDING/CONFIRMED/PROCESSING → prep    : package preparation
 *   SHIPPED                      → shipped : courier arrives ▸ loading ▸ departure
 *   OUT_FOR_DELIVERY             → transit : the road journey
 *   DELIVERED                    → arrived : destination ▸ delivery ▸ "DELIVERED" confirmation
 *   CANCELLED                    → paused  : calm static frame
 *
 * Transitions are opacity cross-fades with each clip's graded poster underneath,
 * so there are no black frames / jump cuts. A slow "Ken Burns" push keeps every
 * shot camera-led. Honors prefers-reduced-motion (renders a high-quality still).
 */

type BeatKey = "pack" | "arrive" | "load" | "depart" | "road" | "road2" | "dest" | "deliver";

const BEATS: Record<BeatKey, { kicker: string; line: string }> = {
  pack: { kicker: "Preparing", line: "Your order is being packed with care." },
  arrive: { kicker: "Courier", line: "Your courier has arrived for pickup." },
  load: { kicker: "Loading", line: "Your parcel is loaded for delivery." },
  depart: { kicker: "Departing", line: "On the move — headed your way." },
  road: { kicker: "On the way", line: "Your order is out for delivery." },
  road2: { kicker: "En route", line: "Travelling toward your address." },
  dest: { kicker: "Almost there", line: "Arriving at your destination." },
  deliver: { kicker: "Delivered", line: "Your CoverCraft order has arrived." },
};

type Phase = "ambient" | "prep" | "shipped" | "transit" | "arrived" | "paused";

const PLAYLIST: Record<Phase, BeatKey[]> = {
  ambient: ["pack", "arrive", "load", "depart", "road", "road2", "dest", "deliver"],
  prep: ["pack"],
  shipped: ["arrive", "load", "depart"],
  transit: ["road", "road2"],
  arrived: ["dest", "deliver"],
  paused: ["pack"],
};

// Whether the final beat holds & loops (settle on the delivered reveal) vs. the
// whole segment looping.
const HOLD_LAST: Record<Phase, boolean> = {
  ambient: false,
  prep: false,
  shipped: false,
  transit: false,
  arrived: true,
  paused: false,
};

function phaseFor(status?: string | null): Phase {
  if (status == null) return "ambient";
  switch (status) {
    case "SHIPPED":
      return "shipped";
    case "OUT_FOR_DELIVERY":
      return "transit";
    case "DELIVERED":
      return "arrived";
    case "CANCELLED":
      return "paused";
    default:
      return "prep"; // PENDING / CONFIRMED / PROCESSING / anything unknown
  }
}

const src = (beat: BeatKey, res: "1080" | "720") => `/track/${beat}-${res}.mp4`;
const poster = (beat: BeatKey) => `/track/${beat}.jpg`;

/** Brand tint + seam-blending overlays that sit over the footage. */
function Grade() {
  return (
    <>
      {/* cool navy veil to pull footage toward blue+black */}
      <div className="absolute inset-0 bg-ink-950/40 mix-blend-multiply" />
      <div
        className="absolute inset-0"
        style={{ background: "linear-gradient(180deg,rgba(4,6,13,0.55) 0%,rgba(6,12,26,0.12) 42%,rgba(4,6,13,0.72) 100%)" }}
      />
      {/* blue key glow from the top */}
      <div
        className="absolute inset-0"
        style={{ background: "radial-gradient(120% 78% at 50% -12%,rgba(37,99,235,0.30),transparent 60%)" }}
      />
      {/* bottom vignette → melts into the page (no hard seam) */}
      <div className="absolute inset-x-0 bottom-0 h-2/5" style={{ background: "linear-gradient(180deg,transparent,#04060d)" }} />
    </>
  );
}

/**
 * Scene-final confirmation — a subtle, premium "DELIVERED" stamp shown over the
 * real doorstep-delivery footage. This is the FINAL shot: the delivered package
 * is the last image (no phone / mobile-cover product reveal).
 */
function DeliveredBadge({ still }: { still: boolean }) {
  return (
    <motion.div
      key="delivered"
      className="pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.4 } }}
      transition={{ duration: 0.8, ease: "easeOut", delay: still ? 0 : 0.5 }}
    >
      {/* soft blue bloom behind the mark */}
      <div className="absolute h-44 w-44 rounded-full bg-accent-500/20 blur-3xl" />
      <motion.div
        className="relative flex h-16 w-16 items-center justify-center rounded-full border border-accent-300/40 bg-ink-950/45 backdrop-blur-md"
        style={{ boxShadow: "0 0 40px rgba(37,99,235,0.35)" }}
        initial={{ scale: still ? 1 : 0.6, opacity: still ? 1 : 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: still ? 0 : 0.6 }}
      >
        <svg
          viewBox="0 0 24 24"
          className="h-7 w-7 text-accent-300"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.6}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <motion.path
            d="M20 6 9 17l-5-5"
            initial={{ pathLength: still ? 1 : 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.55, ease: "easeInOut", delay: still ? 0 : 0.95 }}
          />
        </svg>
      </motion.div>
      <motion.p
        className="relative mt-4 pl-[0.34em] text-xl font-black uppercase tracking-[0.34em] text-white sm:text-2xl"
        initial={{ opacity: 0, y: still ? 0 : 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: still ? 0 : 1.05 }}
      >
        Delivered
      </motion.p>
      <motion.p
        className="relative mt-1.5 text-xs text-slate-300"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: still ? 0 : 1.25 }}
      >
        Your order has arrived.
      </motion.p>
    </motion.div>
  );
}

export default function DeliveryCinematic({ status, className = "" }: { status?: string | null; className?: string }) {
  const reduce = useReducedMotion();
  const phase = phaseFor(status);
  const beats = PLAYLIST[phase];

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
  // Restart the segment whenever the status/phase changes.
  useEffect(() => setIdx(0), [phase]);

  const beat = beats[Math.min(idx, beats.length - 1)];
  const isLast = idx >= beats.length - 1;
  const single = beats.length === 1;
  const holdLast = HOLD_LAST[phase] && isLast;
  const loopThis = single || holdLast;
  const delivered = beat === "deliver";
  const res = mobile ? "720" : "1080";
  const still = reduce || phase === "paused";

  const advance = () => setIdx((i) => (i + 1) % beats.length);

  // Representative still for reduced-motion / pre-mount (last, most-resolved beat).
  const keyBeat = beats[beats.length - 1];

  const dots = useMemo(() => beats.map((b, i) => ({ b, on: i === (idx % beats.length) })), [beats, idx]);

  return (
    <div aria-hidden className={`overflow-hidden bg-ink-950 ${className}`}>
      {/* ---- Footage layer ---- */}
      {!mounted || still ? (
        // Static, high-quality frame (SSR placeholder + reduced-motion + paused)
        <div className="absolute inset-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={poster(still ? keyBeat : beats[0])} alt="" className="h-full w-full object-cover" />
        </div>
      ) : (
        <AnimatePresence>
          <motion.div
            key={phase + "-" + idx}
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.85, ease: "easeInOut" }}
          >
            <motion.video
              ref={videoRef}
              className="h-full w-full object-cover"
              src={src(beat, res)}
              poster={poster(beat)}
              autoPlay
              muted
              playsInline
              preload="auto"
              loop={loopThis}
              onEnded={loopThis ? undefined : advance}
              onError={loopThis ? undefined : advance}
              onCanPlay={(e) => {
                const v = e.currentTarget;
                const p = v.play();
                if (p && typeof p.catch === "function") p.catch(() => {});
              }}
              initial={{ scale: 1.02 }}
              animate={{ scale: 1.09 }}
              transition={{ duration: 9, ease: "linear" }}
            />
          </motion.div>
        </AnimatePresence>
      )}

      {/* ---- Brand grade + seam blend ---- */}
      <Grade />

      {/* ---- Final shot: subtle premium "DELIVERED" confirmation (no phone reveal) ---- */}
      <AnimatePresence>{delivered && <DeliveredBadge key="delivered" still={still} />}</AnimatePresence>

      {/* ---- Scene caption (mapped to the real status) ---- */}
      <div className="pointer-events-none absolute inset-x-0 bottom-3 z-20 flex flex-col items-center gap-2">
        {!delivered && (
          <AnimatePresence mode="wait">
            <motion.div
              key={beat}
              className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-4 py-1.5 backdrop-blur-md"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.4 }}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-accent-400" />
              <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-accent-200">{BEATS[beat].kicker}</span>
              <span className="hidden text-xs text-slate-200 sm:inline">{BEATS[beat].line}</span>
            </motion.div>
          </AnimatePresence>
        )}

        {/* subtle film-progress dots (only when the segment has multiple scenes) */}
        {!still && beats.length > 1 && (
          <div className="flex items-center gap-1.5">
            {dots.map((d, i) => (
              <span
                key={i}
                className={`h-1 rounded-full transition-all duration-500 ${d.on ? "w-4 bg-accent-400" : "w-1.5 bg-white/25"}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
