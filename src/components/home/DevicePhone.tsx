"use client";

import { useState } from "react";
import Image from "next/image";
import type { CatalogProduct } from "@/components/ShopCatalog";
import { resolveProductImage } from "@/lib/productImage";

/**
 * DevicePhone — a realistic, back-facing flagship smartphone (iPhone 17 Pro
 * Max-style) rendered entirely in CSS/DOM. No external 3D assets, no WebGL:
 * layered gradients + rings fake titanium metal, glass, a raised camera plateau
 * with three real lenses, and a premium ORANGE protective case that physically
 * wraps the body.
 *
 * It ships as COMPOSABLE parts so callers keep full control of motion:
 *   <IphoneFrame>            — titanium chassis + side buttons (+ optional glow)
 *     <PhoneBackSurface/>    — the bare back glass + raised camera module
 *     <motion.div ...>       — caller animates this for cover separation
 *       <CoverSkin .../>     — the removable case (orange / themed / product art)
 *     </motion.div>
 *   </IphoneFrame>
 *
 * CAMERA_BOX pins the camera geometry once, so the plateau on the body and the
 * cutout in the case are always perfectly aligned — the key to the separation
 * reading as a real, physical case coming off a real phone.
 */

/** Shared camera-plateau geometry — used by both the body plateau and the case cutout. */
const CAMERA_BOX = "left-[7%] top-[4.2%] h-[32%] w-[39%]";
const CAMERA_RADIUS = "rounded-[28%]";

export type PhoneSkin = "cover" | "navy" | "art" | "gaming" | "sports";

/* ------------------------------------------------------------------ *
 * Titanium chassis. Children stack inside the inset "screen well".
 * ------------------------------------------------------------------ */
export function IphoneFrame({
  children,
  className = "",
  glow = false,
}: {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
}) {
  return (
    <div className={`relative ${className}`}>
      {glow && (
        <div
          aria-hidden
          className="pointer-events-none absolute -inset-8 -z-10 rounded-[3rem] bg-cover-500/25 blur-3xl"
        />
      )}
      {/* Titanium frame: brushed metal with a cool cast + specular edge rails. */}
      <div
        className="relative h-full w-full rounded-[2.9rem] p-[3px] shadow-depth-lg"
        style={{
          backgroundImage:
            "linear-gradient(150deg,#e9edf5 0%,#aab3c4 12%,#71798c 26%,#3b4150 50%,#71798c 74%,#c3cad8 88%,#8a92a4 100%)",
        }}
      >
        {/* Inner bezel wall (dark, gives the frame thickness) */}
        <div className="relative h-full w-full rounded-[2.75rem] bg-[#0a0c12] p-[5px] shadow-[inset_0_0_6px_rgba(0,0,0,0.9)]">
          {/* The back "well" that holds the glass + case. NOT clipped: the bare
              back and the case each self-clip via their own rounded overflow, so
              the case can animate/lift OUT of the frame during separation. */}
          <div className="relative h-full w-full rounded-[2.5rem]">{children}</div>
        </div>
      </div>

      {/* Physical side buttons on the titanium rails */}
      <span aria-hidden className="absolute left-[-3px] top-[26%] h-[7%] w-[3px] rounded-l bg-gradient-to-b from-[#c9cfdb] to-[#5c6373]" />
      <span aria-hidden className="absolute left-[-3px] top-[37%] h-[10%] w-[3px] rounded-l bg-gradient-to-b from-[#c9cfdb] to-[#5c6373]" />
      <span aria-hidden className="absolute left-[-3px] top-[50%] h-[10%] w-[3px] rounded-l bg-gradient-to-b from-[#c9cfdb] to-[#5c6373]" />
      {/* Action + power buttons on the right rail */}
      <span aria-hidden className="absolute right-[-3px] top-[24%] h-[6%] w-[3px] rounded-r bg-gradient-to-b from-[#c9cfdb] to-[#5c6373]" />
      <span aria-hidden className="absolute right-[-3px] top-[40%] h-[13%] w-[3px] rounded-r bg-gradient-to-b from-[#c9cfdb] to-[#5c6373]" />
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * A single realistic lens — metal ring, deep glass, reflection + specular.
 * ------------------------------------------------------------------ */
function Lens({ className = "" }: { className?: string }) {
  return (
    <span className={`absolute grid place-items-center rounded-full ${className}`}
      style={{
        backgroundImage: "conic-gradient(from 210deg,#3a3f4b,#6b7280,#20242e,#565d6b,#2a2e38)",
        boxShadow: "0 1px 2px rgba(0,0,0,0.7), inset 0 0 3px rgba(0,0,0,0.8)",
      }}
    >
      {/* glass barrel */}
      <span className="grid h-[64%] w-[64%] place-items-center rounded-full bg-[radial-gradient(circle_at_35%_30%,#2b3040,#0b0d13_70%)] ring-1 ring-black/70">
        {/* blue aperture reflection */}
        <span className="h-[46%] w-[46%] rounded-full bg-[radial-gradient(circle_at_40%_35%,rgba(96,165,250,0.5),rgba(10,12,20,0.9)_70%)]" />
      </span>
      {/* specular pinpoint */}
      <span className="absolute left-[26%] top-[22%] h-[16%] w-[16%] rounded-full bg-white/80 blur-[0.5px]" />
    </span>
  );
}

/* ------------------------------------------------------------------ *
 * The raised camera module (plateau) that lives on the phone body.
 * ------------------------------------------------------------------ */
export function CameraModule({ className = "" }: { className?: string }) {
  return (
    <div
      className={`absolute ${CAMERA_BOX} ${CAMERA_RADIUS} ${className}`}
      style={{
        backgroundImage:
          "radial-gradient(120% 120% at 30% 20%, #23262f 0%, #14161d 45%, #0a0b10 100%)",
        // The bump: raised edge highlight + soft drop shadow onto the glass below.
        boxShadow:
          "0 6px 16px rgba(0,0,0,0.6), 0 2px 4px rgba(0,0,0,0.7), inset 0 1px 1px rgba(255,255,255,0.14), inset 0 0 0 1px rgba(255,255,255,0.06)",
      }}
    >
      {/* Three-lens triangular array (Pro layout) */}
      <Lens className="left-[9%] top-[8%] h-[40%] w-[40%]" />
      <Lens className="right-[9%] top-[8%] h-[40%] w-[40%]" />
      <Lens className="bottom-[8%] left-[9%] h-[40%] w-[40%]" />
      {/* Flash (dual-tone), LiDAR, microphone */}
      <span
        className="absolute bottom-[30%] right-[16%] h-[13%] w-[13%] rounded-full ring-1 ring-black/60"
        style={{ background: "radial-gradient(circle at 40% 35%, rgba(255,247,230,0.95), #ffd9a3 45%, #7c5b32 100%)" }}
      />
      <span className="absolute bottom-[11%] right-[16%] h-[12%] w-[12%] rounded-full bg-[radial-gradient(circle_at_40%_35%,#333a47,#0a0c12_70%)] ring-1 ring-black/60" />
      <span className="absolute bottom-[13%] right-[38%] h-[5%] w-[5%] rounded-full bg-black/70" />
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * The phone's bare back — deep glass, revealed once the case lifts away.
 * ------------------------------------------------------------------ */
export function PhoneBackSurface() {
  return (
    <div className="absolute inset-0 overflow-hidden rounded-[2.5rem]">
      {/* Frosted matte glass with a cool graphite cast */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(155deg,#1a1e28 0%,#111420 42%,#0a0c14 100%)",
        }}
      />
      {/* Diagonal sheen sweeping across the glass */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-70"
        style={{ backgroundImage: "linear-gradient(120deg,transparent 30%,rgba(255,255,255,0.06) 48%,transparent 62%)" }}
      />
      {/* Etched Apple-style centred mark (abstract, non-proprietary) */}
      <span className="absolute left-1/2 top-[46%] h-9 w-9 -translate-x-1/2 rounded-full bg-white/[0.05] ring-1 ring-inset ring-white/10" />
      <span className="absolute bottom-[7%] left-1/2 -translate-x-1/2 text-[8px] font-medium uppercase tracking-[0.35em] text-white/25">
        Engineered inside
      </span>
      <CameraModule />
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * CoverSkin — the removable protective case that wraps the body.
 * variant="cover" is the premium ORANGE case; art/gaming/sports render a
 * themed procedural face; a product image can also be supplied.
 * ------------------------------------------------------------------ */
export function CoverSkin({
  variant = "cover",
  product,
  label = "CoverCraft",
}: {
  variant?: PhoneSkin;
  product?: CatalogProduct;
  label?: string;
}) {
  const [failed, setFailed] = useState(false);
  const src = product ? resolveProductImage(product.imageUrl, failed) : null;

  return (
    <div className="absolute inset-0 overflow-hidden rounded-[2.5rem]">
      {/* Case material */}
      {src ? (
        <Image src={src} alt={product?.title ?? "Cover"} fill sizes="280px" className="object-cover" onError={() => setFailed(true)} priority />
      ) : (
        <CaseMaterial variant={variant} />
      )}

      {/* Soft-touch top-left sheen (silicone highlight) */}
      <div aria-hidden className="pointer-events-none absolute inset-0" style={{ backgroundImage: "radial-gradient(70% 55% at 26% 14%, rgba(255,255,255,0.22), transparent 60%)" }} />
      {/* Inner edge wrap — the case wall folding over the frame */}
      <div aria-hidden className={`pointer-events-none absolute inset-0 rounded-[2.5rem] ring-2 ring-inset ${variant === "cover" ? "ring-cover-300/40" : "ring-white/15"}`} />
      <div aria-hidden className="pointer-events-none absolute inset-0 rounded-[2.5rem] shadow-[inset_0_2px_6px_rgba(255,255,255,0.18),inset_0_-10px_26px_rgba(0,0,0,0.35)]" />

      {/* Camera cutout — a hole in the case with a raised bezel wall, aligned to
          the body's plateau so the module shows through and stays put on peel. */}
      <div
        className={`absolute ${CAMERA_BOX} ${CAMERA_RADIUS}`}
        style={{
          background: "rgba(0,0,0,0.28)",
          boxShadow:
            "inset 0 0 0 3px rgba(0,0,0,0.35), inset 0 3px 8px rgba(0,0,0,0.55), 0 1px 0 rgba(255,255,255,0.25)",
        }}
      >
        {/* raised protective lip around the opening */}
        <div className={`absolute inset-0 ${CAMERA_RADIUS} ring-2 ring-inset ${variant === "cover" ? "ring-cover-400/60" : "ring-white/20"}`} />
      </div>

      {/* Etched wordmark */}
      <span className={`absolute bottom-[7%] left-1/2 -translate-x-1/2 text-[10px] font-black uppercase tracking-[0.3em] ${variant === "cover" ? "text-black/35" : "text-white/60"}`}>
        {label}
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Procedural case materials (CSS only).
 * ------------------------------------------------------------------ */
function CaseMaterial({ variant }: { variant: PhoneSkin }) {
  if (variant === "cover") {
    // Premium ORANGE case — warm, soft-touch, with depth.
    return (
      <div className="absolute inset-0">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(120% 100% at 30% 18%, #ffb264 0%, #f97316 34%, #ea580c 66%, #b8460c 100%)",
          }}
        />
        {/* subtle grain/texture for a matte silicone feel */}
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.10] mix-blend-overlay"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
          }}
        />
        {/* warm rim light on the right edge */}
        <div aria-hidden className="absolute inset-0" style={{ backgroundImage: "linear-gradient(255deg, rgba(255,210,150,0.5), transparent 30%)" }} />
      </div>
    );
  }

  if (variant === "navy") {
    // Premium NEUTRAL case — deep navy/black, glassy, with brand-blue studio
    // reflections and a soft-white sheen. The reusable, on-brand product finish.
    return (
      <div className="absolute inset-0">
        <div
          className="absolute inset-0"
          style={{ backgroundImage: "radial-gradient(120% 100% at 30% 18%, #1c2e4d 0%, #13223d 40%, #0a1424 74%, #060c17 100%)" }}
        />
        {/* subtle brand-blue reflection (studio softbox) */}
        <div aria-hidden className="absolute inset-0 opacity-80" style={{ backgroundImage: "radial-gradient(58% 42% at 72% 20%, rgba(59,130,246,0.35), transparent 62%)" }} />
        {/* soft-white top-left sheen */}
        <div aria-hidden className="absolute inset-0" style={{ backgroundImage: "linear-gradient(150deg, rgba(255,255,255,0.16), transparent 34%)" }} />
      </div>
    );
  }

  if (variant === "art") {
    return (
      <div className="absolute inset-0">
        <div className="absolute inset-0" style={{ background: "conic-gradient(from 210deg at 32% 26%, #eef2ff, #dbeafe 22%, #bfdbfe 44%, #93c5fd 64%, #fde68a 84%, #eef2ff)" }} />
        <div aria-hidden className="absolute inset-0 opacity-70 mix-blend-overlay" style={{ background: "radial-gradient(60% 40% at 70% 20%, rgba(202,138,4,0.5), transparent 60%), radial-gradient(50% 45% at 20% 80%, rgba(37,99,235,0.4), transparent 60%)" }} />
        <div aria-hidden className="absolute inset-0 opacity-60" style={{ background: "repeating-linear-gradient(115deg, transparent 0 22px, rgba(180,140,40,0.18) 22px 23px, transparent 23px 40px)" }} />
      </div>
    );
  }

  if (variant === "gaming") {
    return (
      <div className="absolute inset-0 bg-[#050912]">
        <div aria-hidden className="absolute inset-x-0 bottom-0 top-1/3 origin-bottom opacity-80" style={{ backgroundImage: "linear-gradient(rgba(56,189,248,0.55) 1px, transparent 1px), linear-gradient(90deg, rgba(56,189,248,0.55) 1px, transparent 1px)", backgroundSize: "26px 26px", transform: "perspective(340px) rotateX(62deg)", maskImage: "linear-gradient(to bottom, transparent, #000 55%)", WebkitMaskImage: "linear-gradient(to bottom, transparent, #000 55%)" }} />
        <div aria-hidden className="absolute inset-0" style={{ background: "radial-gradient(70% 40% at 50% 42%, rgba(56,189,248,0.35), transparent 60%), radial-gradient(50% 30% at 75% 22%, rgba(37,99,235,0.4), transparent 60%)" }} />
      </div>
    );
  }

  // sports
  return (
    <div className="absolute inset-0 bg-[#04120c]">
      <div aria-hidden className="absolute inset-0" style={{ background: "radial-gradient(60% 50% at 30% 20%, rgba(16,185,129,0.45), transparent 60%), radial-gradient(55% 45% at 80% 80%, rgba(163,230,53,0.4), transparent 60%)" }} />
      <div aria-hidden className="absolute inset-0 opacity-70" style={{ background: "repeating-linear-gradient(58deg, transparent 0 16px, rgba(255,255,255,0.10) 16px 18px, transparent 18px 30px)" }} />
      <span className="absolute inset-0 flex items-center justify-center font-display text-[9rem] font-bold leading-none text-white/15">09</span>
    </div>
  );
}
