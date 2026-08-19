"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useCart } from "@/lib/cartStore";
import { resolveProductImage } from "@/lib/productImage";
import { armProductFlip } from "@/lib/transition";
import WishlistButton from "@/components/WishlistButton";
import { DUR, EASE_OUT_EXPO, viewportOnce } from "@/lib/motion";

interface Props {
  id: string;
  title: string;
  price: number; // cents
  imageUrl: string;
  category?: string | null;
  brand?: string | null;
  model?: string | null;
  stock?: number;
  isAvailable?: boolean;
  featured?: boolean;
  wishlisted?: boolean;
  index?: number;
}

export default function ProductCard({ id, title, price, imageUrl, category, brand, model, stock, isAvailable, featured, wishlisted, index = 0 }: Props) {
  const addItem = useCart((s) => s.addItem);
  const imageRef = useRef<HTMLDivElement>(null);
  const [imageFailed, setImageFailed] = useState(false);
  const [added, setAdded] = useState(false);

  const displayImageUrl = resolveProductImage(imageUrl, imageFailed);
  const isOutOfStock = typeof stock === "number" && stock <= 0;
  const availabilityText = isOutOfStock ? "Out of Stock" : isAvailable === false ? "Unavailable" : "Available";
  const href = `/products/${id}`;

  const handleAdd = () => {
    if (isOutOfStock) return;
    addItem({ productId: id, title, price, imageUrl });
    // Show an in-place confirmation; the header cart badge bounces in tandem.
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1600);
  };

  // Capture the cover image's viewport rect + resolved src on a plain click so
  // the product page can fly it into the hero (Phase 9 FLIP). Modifier / middle
  // clicks (open in new tab) are skipped so no orphaned flip is left armed.
  const captureFlip = (e: React.MouseEvent) => {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const el = imageRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    armProductFlip({ id, src: displayImageUrl, rect: { top: r.top, left: r.left, width: r.width, height: r.height }, radius: 24, ts: Date.now() });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={viewportOnce}
      transition={{ duration: DUR.section, ease: EASE_OUT_EXPO, delay: (index % 5) * 0.05 }}
      whileHover={{ y: -6, rotate: -0.6 }}
      className="group relative flex flex-col overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_2px_10px_rgb(15_23_42_/_0.04)] transition-[box-shadow,border-color] duration-300 hover:border-accent-300 hover:shadow-[0_22px_48px_-16px_rgb(37_99_235_/_0.30)]"
    >
      <div ref={imageRef} className="relative aspect-[4/4.35] overflow-hidden bg-gradient-to-b from-slate-100 to-slate-200/60">
        <Link href={href} aria-label={`View ${title}`} onClick={captureFlip}>
          <Image src={displayImageUrl} alt={title} fill sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw" className={`object-cover transition duration-[650ms] ease-out group-hover:scale-[1.06] ${isOutOfStock ? "opacity-60 saturate-50" : ""}`} onError={() => setImageFailed(true)} />
        </Link>
        {/* Faint scrim on hover so the wishlist heart and any badge stay legible over bright art. */}
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        {featured && <motion.span initial={{ opacity: 0, scale: 0.6 }} whileInView={{ opacity: 1, scale: 1 }} viewport={viewportOnce} transition={{ duration: DUR.base, ease: EASE_OUT_EXPO, delay: 0.15 }} className="absolute left-3 top-3 rounded-full bg-accent-600 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-white shadow-glow-sm">New</motion.span>}
        {isOutOfStock && <span className="absolute inset-x-0 bottom-0 bg-slate-950/80 py-1.5 text-center text-[10px] font-black uppercase tracking-wider text-white backdrop-blur-sm">Out of stock</span>}
        <WishlistButton productId={id} title={title} initial={Boolean(wishlisted)} className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full shadow-md ring-1 ring-black/5 backdrop-blur transition" />
      </div>
      <div className="flex flex-col gap-1.5 p-3.5">
        {category && <span className="text-[11px] font-bold uppercase tracking-[.14em] text-accent-700">{category}</span>}
        <Link href={href} onClick={captureFlip} className="line-clamp-1 font-display text-[15px] font-black tracking-tight text-slate-900 transition hover:text-accent-700">{title}</Link>
        {brand && model ? <p className="text-xs text-slate-500">Fits {brand} {model}</p> : null}
        {!brand && !model && category ? <p className="text-xs text-slate-500">{category}</p> : null}
        <p className="font-display text-lg font-black text-slate-900">Rs. {(price / 100).toLocaleString()} {featured && <span className="ml-1 align-middle text-xs font-normal text-slate-400 line-through">Rs. {(price / 90).toFixed(0)}</span>}</p>
        <p className={`flex items-center gap-1.5 text-xs font-semibold ${isOutOfStock ? "text-slate-400" : "text-emerald-600"}`}><span aria-hidden className={`inline-block h-1.5 w-1.5 rounded-full ${isOutOfStock ? "bg-slate-300" : "bg-emerald-500"}`} />{availabilityText}</p>
        <motion.button
          onClick={handleAdd}
          whileTap={{ scale: 0.95 }}
          transition={{ duration: DUR.micro, ease: EASE_OUT_EXPO }}
          className={`relative mt-1.5 h-9 overflow-hidden rounded-xl text-[11px] font-bold uppercase tracking-wide text-white transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-60 ${added ? "bg-emerald-600" : "bg-slate-950 hover:bg-accent-700"}`}
          disabled={isOutOfStock}
        >
          <AnimatePresence initial={false} mode="popLayout">
            {isOutOfStock ? (
              <motion.span key="oos" className="absolute inset-0 flex items-center justify-center">Out of Stock</motion.span>
            ) : added ? (
              <motion.span key="added" initial={{ y: 14, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -14, opacity: 0 }} transition={{ duration: DUR.micro, ease: EASE_OUT_EXPO }} className="absolute inset-0 flex items-center justify-center gap-1">
                <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                Added
              </motion.span>
            ) : (
              <motion.span key="add" initial={{ y: 14, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -14, opacity: 0 }} transition={{ duration: DUR.micro, ease: EASE_OUT_EXPO }} className="absolute inset-0 flex items-center justify-center">Add to Cart</motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>
    </motion.div>
  );
}
