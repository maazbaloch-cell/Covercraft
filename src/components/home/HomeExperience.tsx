"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import type { CatalogProduct } from "@/components/ShopCatalog";
import { resolveProductImage } from "@/lib/productImage";
import ScrollStory from "./ScrollStory";
import CoverWorlds from "./CoverWorlds";
import {
  EASE_CINEMATIC,
  EASE_OUT_EXPO,
  DUR,
  cinematicReveal,
  blurIn,
  lineStagger,
  lineChild,
  viewportOnce,
} from "@/lib/motion";

/**
 * CinematicHome — the CoverCraft landing experience.
 *
 * A dark, immersive brand story that sits on top of the existing motion tokens.
 * The shopping catalog lives at /shop; this page's job is DISCOVER → ENTER →
 * EXPLORE: a hero with the cover as a floating hero object (Hero), the
 * scroll-as-camera "enter the product" scene (ScrollStory, Phase 4), the three
 * immersive cover worlds (CoverWorlds, Phase 5), a strip of real featured
 * products, and a closing call to action.
 *
 * A later phase adds the Sports→Catalog single-shot transition. All
 * scroll-linked parallax is gated on prefers-reduced-motion; entrance
 * animations flow through <MotionProvider>.
 */
export default function HomeExperience({ featured }: { featured: CatalogProduct[] }) {
  return (
    <div className="cinematic-scene relative isolate overflow-x-clip">
      {/* Ambient cinematic backdrop */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-aurora animate-aurora-drift" />
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-grain opacity-[0.12] mix-blend-soft-light" />

      <Hero cover={featured[0]} />
      <ScrollStory cover={featured[0]} />
      <CoverWorlds />
      {featured.length > 0 && <Featured products={featured} />}
      <Closing />
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Hero — the cover as a floating hero object.
 * ------------------------------------------------------------------ */
function Hero({ cover }: { cover?: CatalogProduct }) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });

  // Scroll-as-camera (gated for reduced motion): copy drifts up + fades, phone
  // sinks and rotates a touch as the hero scrolls away.
  const copyY = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : -70]);
  const copyOpacity = useTransform(scrollYProgress, [0, 0.7], [1, reduce ? 1 : 0]);
  const phoneY = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : 90]);
  const phoneRotate = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : 8]);

  return (
    <section
      ref={ref}
      className="relative mx-auto flex min-h-[92vh] w-full max-w-[var(--cinema-max)] flex-col items-center gap-12 px-6 pb-24 pt-16 sm:pt-20 lg:flex-row lg:gap-8 lg:pt-24"
    >
      {/* Copy */}
      <motion.div
        style={{ y: copyY, opacity: copyOpacity }}
        className="relative z-10 flex-1 text-center lg:text-left"
      >
        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: DUR.section, ease: EASE_CINEMATIC }}
          className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.22em] text-accent-300"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-accent-400 animate-pulse-glow" />
          Premium mobile covers · Pakistan
        </motion.p>

        <motion.h1
          variants={lineStagger}
          initial="hidden"
          animate="show"
          className="mt-6 font-display text-5xl font-bold leading-[0.98] tracking-cinema text-white sm:text-6xl lg:text-7xl"
        >
          <motion.span variants={lineChild} className="block">Your phone,</motion.span>
          <motion.span variants={lineChild} className="block">wrapped in a</motion.span>
          <motion.span variants={lineChild} className="block text-gradient">story.</motion.span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: DUR.slow, ease: EASE_CINEMATIC, delay: 0.35 }}
          className="mx-auto mt-6 max-w-md text-base leading-7 text-slate-300 lg:mx-0 lg:text-lg"
        >
          Covers engineered to protect — designed to turn heads. Explore the
          collection, or craft one that&rsquo;s unmistakably yours.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: DUR.slow, ease: EASE_CINEMATIC, delay: 0.5 }}
          className="mt-9 flex flex-col items-center gap-3 sm:flex-row lg:items-start"
        >
          <Link
            href="/shop"
            className="group inline-flex items-center gap-2 rounded-full bg-accent-600 px-7 py-3.5 text-sm font-bold text-white shadow-glow transition-transform duration-200 hover:scale-[1.03] hover:bg-accent-500 active:scale-95"
          >
            Enter the shop
            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
          </Link>
          <Link
            href="/customize-cover"
            className="glass inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-bold text-white transition-colors duration-200 hover:bg-white/10"
          >
            Design your own
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: DUR.slow, ease: EASE_OUT_EXPO, delay: 0.7 }}
          className="mt-8 flex items-center justify-center gap-6 text-xs text-slate-400 lg:justify-start"
        >
          <span className="flex items-center gap-1.5"><Dot /> Secure EasyPaisa checkout</span>
          <span className="flex items-center gap-1.5"><Dot /> Fast dispatch nationwide</span>
        </motion.div>
      </motion.div>

      {/* Floating cover / phone */}
      <motion.div
        style={{ y: phoneY, rotate: phoneRotate }}
        className="relative z-10 flex flex-1 items-center justify-center"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 1.1, ease: EASE_CINEMATIC, delay: 0.2 }}
          className="relative"
        >
          <div className="absolute -inset-10 -z-10 rounded-full bg-accent-600/25 blur-3xl animate-pulse-glow" />
          <PhoneMock cover={cover} float />
        </motion.div>
      </motion.div>

      {/* Scroll cue */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: DUR.slow, delay: 1 }}
        className="absolute bottom-6 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-slate-500"
      >
        Scroll
        <motion.span
          aria-hidden
          animate={reduce ? undefined : { y: [0, 7, 0] }}
          transition={{ duration: 1.6, ease: "easeInOut", repeat: Infinity }}
          className="text-base"
        >
          ↓
        </motion.span>
      </motion.div>
    </section>
  );
}

/* ------------------------------------------------------------------ *
 * Featured — real products from the catalog.
 * ------------------------------------------------------------------ */
function Featured({ products }: { products: CatalogProduct[] }) {
  return (
    <section className="relative mx-auto w-full max-w-[var(--cinema-max)] px-6 py-20 sm:py-28">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SectionHeading eyebrow="New" title="Fresh from the workshop" align="left" />
        <Link href="/shop" className="group inline-flex items-center gap-1.5 text-sm font-bold text-accent-300 transition-colors hover:text-white">
          View all covers
          <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
        </Link>
      </div>
      <motion.div
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.07 } } }}
        initial="hidden"
        whileInView="show"
        viewport={viewportOnce}
        className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4"
      >
        {products.slice(0, 4).map((p) => (
          <FeaturedCard key={p.id} product={p} />
        ))}
      </motion.div>
    </section>
  );
}

function FeaturedCard({ product }: { product: CatalogProduct }) {
  const [failed, setFailed] = useState(false);
  const src = resolveProductImage(product.imageUrl, failed);
  return (
    <motion.div variants={cinematicReveal}>
      <Link
        href={`/products/${product.id}`}
        className="group flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] transition-all duration-300 hover:border-accent-400/40 hover:shadow-glow"
      >
        <div className="relative aspect-square overflow-hidden bg-ink-800">
          <Image
            src={src}
            alt={product.title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
            onError={() => setFailed(true)}
          />
        </div>
        <div className="flex flex-col gap-1 p-4">
          {product.category && (
            <span className="text-[11px] font-semibold uppercase tracking-widest text-accent-300">{product.category}</span>
          )}
          <span className="line-clamp-1 text-sm font-bold text-white transition-colors group-hover:text-accent-300">{product.title}</span>
          <span className="mt-1 text-sm font-black text-white">Rs. {(product.price / 100).toLocaleString()}</span>
        </div>
      </Link>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ *
 * Closing — final call to action.
 * ------------------------------------------------------------------ */
function Closing() {
  return (
    <section className="relative mx-auto w-full max-w-[var(--cinema-max)] px-6 pb-28 pt-8">
      <motion.div
        variants={blurIn}
        initial="hidden"
        whileInView="show"
        viewport={viewportOnce}
        className="glow-ring relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-ink-700 to-ink-900 px-8 py-16 text-center sm:py-20"
      >
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-aurora opacity-60" />
        <div className="relative">
          <h2 className="mx-auto max-w-2xl font-display text-4xl font-bold leading-tight tracking-cinema text-white sm:text-5xl">
            Ready to dress your phone?
          </h2>
          <p className="mx-auto mt-4 max-w-md text-base text-slate-300">
            Find your cover in the collection, or start from a blank canvas and make it yours.
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-bold text-ink-950 transition-transform duration-200 hover:scale-[1.03] active:scale-95"
            >
              Shop the collection
            </Link>
            <Link
              href="/customize-cover"
              className="glass inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-bold text-white transition-colors duration-200 hover:bg-white/10"
            >
              Create a custom cover
            </Link>
          </div>
        </div>
      </motion.div>
    </section>
  );
}

/* ------------------------------------------------------------------ *
 * Shared bits.
 * ------------------------------------------------------------------ */
function SectionHeading({ eyebrow, title, align = "center" }: { eyebrow: string; title: string; align?: "center" | "left" }) {
  return (
    <motion.div
      variants={cinematicReveal}
      initial="hidden"
      whileInView="show"
      viewport={viewportOnce}
      className={align === "center" ? "text-center" : "text-left"}
    >
      <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-accent-400">{eyebrow}</p>
      <h2 className="mt-3 font-display text-3xl font-bold tracking-cinema text-white sm:text-4xl">{title}</h2>
    </motion.div>
  );
}

function Dot() {
  return <span className="h-1 w-1 rounded-full bg-accent-400" />;
}

/**
 * PhoneMock — a CSS/DOM rendering of a phone shown from the back, so the cover
 * (the product) is the hero. Uses a real product image when available, else a
 * gradient. No external assets required.
 */
function PhoneMock({ cover, float = false }: { cover?: CatalogProduct; float?: boolean }) {
  const [failed, setFailed] = useState(false);
  const src = cover ? resolveProductImage(cover.imageUrl, failed) : null;
  return (
    <motion.div
      animate={float ? { y: [0, -14, 0] } : undefined}
      transition={float ? { duration: 6.5, ease: "easeInOut", repeat: Infinity } : undefined}
      className="relative h-[520px] w-[260px] rounded-[2.75rem] border border-white/15 bg-gradient-to-b from-white/10 to-white/[0.02] p-2.5 shadow-depth-lg"
    >
      {/* Cover surface */}
      <div className="relative h-full w-full overflow-hidden rounded-[2.2rem] bg-ink-800">
        {src ? (
          <Image src={src} alt={cover?.title ?? "Featured cover"} fill sizes="260px" className="object-cover" onError={() => setFailed(true)} priority />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-accent-500 via-accent-700 to-ink-900" />
        )}
        {/* Sheen */}
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent" />
        {/* Camera module */}
        <div className="absolute left-4 top-4 flex h-20 w-20 items-center justify-center rounded-2xl border border-white/15 bg-black/40 backdrop-blur-sm">
          <div className="grid grid-cols-2 gap-1.5">
            <span className="h-6 w-6 rounded-full bg-ink-950 ring-2 ring-white/10" />
            <span className="h-6 w-6 rounded-full bg-ink-950 ring-2 ring-white/10" />
            <span className="h-6 w-6 rounded-full bg-ink-950 ring-2 ring-white/10" />
            <span className="h-6 w-6 rounded-full bg-accent-500/40 ring-2 ring-white/10" />
          </div>
        </div>
        {/* Etched wordmark */}
        <span className="absolute bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-black uppercase tracking-[0.3em] text-white/50">CoverCraft</span>
      </div>
    </motion.div>
  );
}
