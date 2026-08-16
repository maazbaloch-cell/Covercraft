"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useCart } from "@/lib/cartStore";
import WishlistButton from "@/components/WishlistButton";
import { resolveProductImage } from "@/lib/productImage";
import { DUR, EASE_OUT_EXPO } from "@/lib/motion";

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
      <div className="relative aspect-square overflow-hidden rounded-3xl border border-slate-200 bg-slate-100">
        <Image src={displayImageUrl} alt={p.title} fill sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover" priority onError={() => setImageFailed(true)} />
        <WishlistButton productId={p.id} title={p.title} initial={wishlisted} className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full text-lg shadow-lg transition" />
      </div>

      <div className="flex flex-col">
        {p.category && <span className="text-xs font-bold uppercase tracking-[.2em] text-violet-700">{p.category}</span>}
        <h1 className="mt-2 text-3xl font-black leading-tight text-slate-950 sm:text-4xl">{p.title}</h1>
        {(p.brand || p.model) && <p className="mt-2 text-sm text-slate-500">{[p.brand, p.model].filter(Boolean).join(" · ")}</p>}
        <p className="mt-1 text-sm text-amber-500">★★★★★ <span className="text-slate-400">(4.8)</span></p>

        <p className="mt-5 text-3xl font-black text-slate-950">Rs. {(p.price / 100).toLocaleString()}</p>
        <p className={`mt-2 text-sm font-semibold ${isOutOfStock ? "text-rose-600" : "text-emerald-600"}`}>
          {isOutOfStock ? "Out of stock" : p.stock <= 5 ? `Only ${p.stock} left in stock` : "In stock"}
        </p>

        {p.description && <p className="mt-5 max-w-prose leading-7 text-slate-600">{p.description}</p>}

        {!isOutOfStock && (
          <div className="mt-6 flex items-center gap-3">
            <span className="text-sm font-semibold text-slate-700">Quantity</span>
            <div className="flex items-center rounded-xl border border-slate-200">
              <motion.button whileTap={{ scale: 0.85 }} type="button" aria-label="Decrease quantity" onClick={() => setQty((q) => Math.max(1, q - 1))} disabled={qty <= 1} className="px-3 py-2 text-lg font-bold text-slate-600 transition-colors hover:text-violet-700 disabled:opacity-40">−</motion.button>
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.span key={qty} initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -10, opacity: 0 }} transition={{ duration: DUR.micro, ease: EASE_OUT_EXPO }} className="inline-block w-10 text-center text-sm font-bold">{qty}</motion.span>
              </AnimatePresence>
              <motion.button whileTap={{ scale: 0.85 }} type="button" aria-label="Increase quantity" onClick={() => setQty((q) => Math.min(maxQty, q + 1))} disabled={qty >= maxQty} className="px-3 py-2 text-lg font-bold text-slate-600 transition-colors hover:text-violet-700 disabled:opacity-40">+</motion.button>
            </div>
          </div>
        )}

        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          <motion.button whileHover={isOutOfStock ? undefined : { scale: 1.02 }} whileTap={{ scale: 0.97 }} transition={{ duration: DUR.micro, ease: EASE_OUT_EXPO }} onClick={() => addToCart(false)} disabled={isOutOfStock} className={`relative flex flex-1 items-center justify-center overflow-hidden rounded-xl border px-6 py-3 text-sm font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${added ? "border-emerald-600 bg-emerald-600 text-white" : "border-slate-950 text-slate-950 hover:bg-slate-950 hover:text-white"}`}>
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span key={added ? "added" : isOutOfStock ? "oos" : "add"} initial={{ y: 14, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -14, opacity: 0 }} transition={{ duration: DUR.micro, ease: EASE_OUT_EXPO }} className="flex items-center gap-1.5">
                {added ? "✓ Added to cart" : isOutOfStock ? "Out of stock" : "Add to cart"}
              </motion.span>
            </AnimatePresence>
          </motion.button>
          <motion.button whileHover={isOutOfStock ? undefined : { scale: 1.02 }} whileTap={{ scale: 0.97 }} transition={{ duration: DUR.micro, ease: EASE_OUT_EXPO }} onClick={() => addToCart(true)} disabled={isOutOfStock} className="flex-1 rounded-xl bg-slate-950 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50">
            Buy now
          </motion.button>
        </div>

        <div className="mt-8 grid gap-3 border-t border-slate-100 pt-6 text-sm text-slate-600 sm:grid-cols-2">
          <p className="flex items-center gap-2"><span className="text-violet-700">▣</span> Secure EasyPaisa checkout</p>
          <p className="flex items-center gap-2"><span className="text-violet-700">↗</span> Fast dispatch across Pakistan</p>
          <p className="flex items-center gap-2"><span className="text-violet-700">↶</span> Easy returns &amp; support</p>
          <p className="flex items-center gap-2"><span className="text-violet-700">✦</span> Premium, made-to-last quality</p>
        </div>

        <Link href="/" className="mt-8 text-sm font-bold text-violet-700">← Back to all covers</Link>
      </div>
    </div>
  );
}
