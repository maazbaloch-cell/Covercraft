"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useReducedMotion, type MotionValue } from "framer-motion";
import { IphoneFrame, PhoneBackSurface, CoverSkin, type PhoneSkin } from "./DevicePhone";

/**
 * Phone3D — a REAL (WebGL) iPhone 17 Pro Max-style device, back-facing.
 *
 * This replaces the flat CSS mock with genuine 3D geometry (titanium frame, dark
 * glass back, a raised camera plateau with three real lens barrels, LiDAR + flash)
 * and a premium ORANGE case that is a SEPARATE physical object — an extruded shell
 * with a REAL camera cutout that lifts off the body during the scroll story while
 * the camera module stays put.
 *
 * The heavy three/fiber/drei code lives in ./Phone3DCanvas and is pulled in with
 * next/dynamic({ ssr: false }), so it never weighs down the initial bundle: the
 * server + first client render paint the light CSS device, then WebGL streams in
 * and upgrades it. It is driven by the page's EXISTING framer-motion scroll values
 * (passed as MotionValues), so the cinematic scroll timeline is preserved — only
 * the phone's rendering changes. Falls back to the CSS device permanently on the
 * server, under prefers-reduced-motion, and where WebGL is unavailable.
 */

export type Phone3DProps = {
  skin?: PhoneSkin;
  className?: string;
  glow?: boolean;
  /** Idle presentation: gentle float + slow auto-rotate (Hero / worlds). */
  idle?: boolean;
  /** 0 → case seated, 1 → case fully lifted & rotated away (ScrollStory). */
  separation?: MotionValue<number>;
  /** Extra yaw in radians driven by scroll — the "camera orbits the phone" beat. */
  spin?: MotionValue<number>;
  /** Baseline yaw so a static/idle phone still shows a flattering 3-quarter back. */
  baseYaw?: number;
};

// Per-skin ambient glow colour (kept here so the tiny glow div doesn't have to
// pull in the 3D chunk just to look up a colour).
const GLOW: Record<PhoneSkin, string> = {
  cover: "#f97316",
  art: "#60a5fa",
  gaming: "#38bdf8",
  sports: "#10b981",
};

// Client-only WebGL canvas. While its chunk loads, show a skin-agnostic bare
// dark phone (no coloured case) so there's never a wrong-colour flash — the 3D
// phone then arrives already wearing the correct case.
const Phone3DCanvas = dynamic(() => import("./Phone3DCanvas"), {
  ssr: false,
  loading: () => (
    <IphoneFrame className="h-full w-full">
      <PhoneBackSurface />
    </IphoneFrame>
  ),
});

function supportsWebGL(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const c = document.createElement("canvas");
    return !!(window.WebGLRenderingContext && (c.getContext("webgl") || c.getContext("experimental-webgl")));
  } catch {
    return false;
  }
}

export default function Phone3D({ skin = "cover", className = "", glow = false, idle = false, separation, spin, baseYaw = -0.42 }: Phone3DProps) {
  const reduce = useReducedMotion();
  const [enabled, setEnabled] = useState(false);
  const [inView, setInView] = useState(true);
  const wrap = useRef<HTMLDivElement>(null);

  // Decide AFTER mount so the server + first client render both paint the CSS
  // fallback (no hydration mismatch); then upgrade to WebGL when it's safe.
  useEffect(() => {
    setEnabled(!reduce && supportsWebGL());
  }, [reduce]);

  // Pause rendering while the phone is scrolled off-screen (perf).
  useEffect(() => {
    const el = wrap.current;
    if (!el || !enabled) return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { rootMargin: "200px" });
    io.observe(el);
    return () => io.disconnect();
  }, [enabled]);

  if (!enabled) {
    // SSR / reduced-motion / no-WebGL: the composable CSS device (static, safe).
    return (
      <div className={className}>
        <IphoneFrame glow={glow} className="h-full w-full">
          <PhoneBackSurface />
          <CoverSkin variant={skin} />
        </IphoneFrame>
      </div>
    );
  }

  return (
    <div ref={wrap} className={`relative ${className}`}>
      {glow && (
        <div aria-hidden className="pointer-events-none absolute -inset-8 -z-10 rounded-[3rem] blur-3xl" style={{ background: `${GLOW[skin]}30` }} />
      )}
      <Phone3DCanvas skin={skin} idle={idle} separation={separation} spin={spin} baseYaw={baseYaw} reduce={!!reduce} inView={inView} />
    </div>
  );
}
