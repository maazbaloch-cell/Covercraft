"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useCart } from "@/lib/cartStore";
import WishlistButton from "@/components/WishlistButton";
import { resolveProductImage } from "@/lib/productImage";
import { DUR, DUR_CINEMA, EASE_OUT_EXPO, EASE_CINEMATIC } from "@/lib/motion";

export interface ProductDetailProps {
  id: string;
  title: string;
  price: number; // cents
  imageUrl: string;
  description?: string | null;
  category?: string | null;
  brand?: string | null;
  model?: string | null;
  stock: number;
  isAvailable: boolean;
  wishlisted?: boolean;
}

export default function ProductDetail(p: ProductDetailProps) {
  const addItem = useCart((s) => s.addItem);
  const router = useRouter();
  const [qty, setQty] = useState(1);
  const [imageFailed, setImageFailed] = useState(false);
  const [added, setAdded] = useState(false);
  const [wishlisted, setWishlisted] = useState(Boolean(p.wishlisted));
  // Resolve whether this product is already saved so the heart renders in the right state.
  useEffect(() => { let alive = true; fetch("/api/customer/wishlist", { credentials: "include" }).then((r) => (r.ok ? r.json() : null)).then((d) => { if (alive && d?.items) setWishlisted(d.items.some((i: { productId: string }) => i.productId === p.id)); }).catch(() => {}); return () => { alive = false; }; }, [p.id]);

  const isOutOfStock = p.stock <= 0 || p.isAvailable === false;
  const maxQty = Math.min(p.stock > 0 ? p.stock : 1, 10);
  const displayImageUrl = resolveProductImage(p.imageUrl, imageFailed);

  const addToCart = (goToCart: boolean) => {
    // The cart store increments by one per call; add `qty` copies.
    for (let n = 0; n < qty; n += 1) addItem({ productId: p.id, title: p.title, price: p.price, imageUrl: p.imageUrl });
    if (goToCart) router.push("/cart");
    else {
      setAdded(true);
      window.setTimeout(() => setAdded(false), 2000);
    }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
      {/* Hero showcase. The frame is geometrically static so the /shop→hero FLIP
          (Phase 9) lands precisely on data-flip-hero; the glow is a sibling behind
          it, so hiding the hero mid-flight never disturbs the halo. */}
      <div className="relative isolate self-start">
        <div aria-hidden className="glow-ring pointer-events-none absolute inset-8 -z-10 rounded-full opacity-70" />
        <div data-flip-hero className="relative aspect-square overflow-hidden rounded-3xl border border-white/10 bg-ink-800 shadow-depth-lg">
          <Image src={displayImageUrl} alt={p.title} fill sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover" priority onError={() => setImageFailed(true)} />
          <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink-950/40 via-transparent to-transparent" />
          <WishlistButton productId={p.id} title={p.title} initial={wishlisted} className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full text-lg shadow-lg transition" />
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: DUR_CINEMA.entrance, ease: EASE_CINEMATIC, delay: 0.1 }} className="flex flex-col">
        {p.category && <span className="text-xs font-bold uppercase tracking-[.2em] text-accent-300">{p.category}</span>}
        <h1 className="mt-2 font-display text-3xl font-black leading-tight tracking-cinema text-white sm:text-4xl">{p.title}</h1>
        {(p.brand || p.model) && <p className="mt-2 text-sm text-slate-400">Compatible with {[p.brand, p.model].filter(Boolean).join(" ")}</p>}

        <p className="mt-5 font-display text-3xl font-black text-white">Rs. {(p.price / 100).toLocaleString()}</p>
        <p className={`mt-2 text-sm font-semibold ${isOutOfStock ? "text-rose-400" : "text-emerald-400"}`}>
          {isOutOfStock ? "Out of stock" : p.stock <= 5 ? `Only ${p.stock} left in stock` : "In stock"}
        </p>

        {p.description && <p className="mt-5 max-w-prose leading-7 text-slate-300">{p.description}</p>}

        {!isOutOfStock && (
          <div className="mt-6 flex items-center gap-3">
            <span className="text-sm font-semibold text-slate-300">Quantity</span>
            <div className="flex items-center rounded-xl border border-white/15 bg-white/5">
              <motion.button whileTap={{ scale: 0.85 }} type="button" aria-label="Decrease quantity" onClick={() => setQty((q) => Math.max(1, q - 1))} disabled={qty <= 1} className="px-3 py-2 text-lg font-bold text-slate-300 transition-colors hover:text-accent-300 disabled:opacity-40">−</motion.button>
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.span key={qty} initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -10, opacity: 0 }} transition={{ duration: DUR.micro, ease: EASE_OUT_EXPO }} className="inline-block w-10 text-center text-sm font-bold text-white">{qty}</motion.span>
              </AnimatePresence>
              <motion.button whileTap={{ scale: 0.85 }} type="button" aria-label="Increase quantity" onClick={() => setQty((q) => Math.min(maxQty, q + 1))} disabled={qty >= maxQty} className="px-3 py-2 text-lg font-bold text-slate-300 transition-colors hover:text-accent-300 disabled:opacity-40">+</motion.button>
            </div>
          </div>
        )}

        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          <motion.button whileHover={isOutOfStock ? undefined : { scale: 1.02 }} whileTap={{ scale: 0.97 }} transition={{ duration: DUR.micro, ease: EASE_OUT_EXPO }} onClick={() => addToCart(false)} disabled={isOutOfStock} className={`relative flex flex-1 items-center justify-center overflow-hidden rounded-xl border px-6 py-3 text-sm font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${added ? "border-emerald-500 bg-emerald-500 text-white" : "border-white/20 text-white hover:bg-white hover:text-ink-950"}`}>
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span key={added ? "added" : isOutOfStock ? "oos" : "add"} initial={{ y: 14, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -14, opacity: 0 }} transition={{ duration: DUR.micro, ease: EASE_OUT_EXPO }} className="flex items-center gap-1.5">
                {added ? "✓ Added to cart" : isOutOfStock ? "Out of stock" : "Add to cart"}
              </motion.span>
            </AnimatePresence>
          </motion.button>
          <motion.button whileHover={isOutOfStock ? undefined : { scale: 1.02 }} whileTap={{ scale: 0.97 }} transition={{ duration: DUR.micro, ease: EASE_OUT_EXPO }} onClick={() => addToCart(true)} disabled={isOutOfStock} className="flex-1 rounded-xl bg-accent-600 px-6 py-3 text-sm font-bold text-white shadow-glow transition-colors hover:bg-accent-500 disabled:cursor-not-allowed disabled:opacity-50">
            Buy now
          </motion.button>
        </div>

        <div className="mt-8 grid gap-3 border-t border-white/10 pt-6 text-sm text-slate-300 sm:grid-cols-2">
          <p className="flex items-center gap-2"><span className="text-accent-300">▣</span> Secure EasyPaisa checkout</p>
          <p className="flex items-center gap-2"><span className="text-accent-300">↗</span> Fast dispatch across Pakistan</p>
          <p className="flex items-center gap-2"><span className="text-accent-300">↶</span> Easy returns &amp; support</p>
          <p className="flex items-center gap-2"><span className="text-accent-300">✦</span> Premium, made-to-last quality</p>
        </div>

        <Link href="/shop" className="mt-8 text-sm font-bold text-accent-300 transition hover:text-accent-200">← Back to all covers</Link>
      </motion.div>
    </div>
  );
}
