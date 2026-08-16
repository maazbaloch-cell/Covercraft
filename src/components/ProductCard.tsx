"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useCart } from "@/lib/cartStore";
import { resolveProductImage } from "@/lib/productImage";
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={viewportOnce}
      transition={{ duration: DUR.section, ease: EASE_OUT_EXPO, delay: (index % 5) * 0.05 }}
      whileHover={{ y: -6 }}
      className="group relative flex flex-col overflow-hidden rounded-[1.15rem] border border-slate-200/90 bg-white shadow-[0_3px_14px_rgb(15_23_42_/_0.05)] transition-[box-shadow,border-color] duration-300 hover:border-violet-200 hover:shadow-[0_14px_28px_rgb(15_23_42_/_0.12)]"
    >
      <div className="relative aspect-[4/4.35] overflow-hidden bg-slate-100">
        <Link href={href} aria-label={`View ${title}`}>
          <Image src={displayImageUrl} alt={title} fill sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw" className="object-cover transition duration-500 ease-out group-hover:scale-[1.05]" onError={() => setImageFailed(true)} />
        </Link>
        {featured && <motion.span initial={{ opacity: 0, scale: 0.6 }} whileInView={{ opacity: 1, scale: 1 }} viewport={viewportOnce} transition={{ duration: DUR.base, ease: EASE_OUT_EXPO, delay: 0.15 }} className="absolute left-3 top-3 rounded-full bg-violet-600 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-white">New</motion.span>}
        <WishlistButton productId={id} title={title} initial={Boolean(wishlisted)} className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full shadow transition" />
      </div>
      <div className="p-3 flex flex-col gap-1.5">
        {category && <span className="text-xs text-brand-accent uppercase tracking-wide">{category}</span>}
        <Link href={href} className="line-clamp-1 text-sm font-bold text-slate-900 transition hover:text-violet-700">{title}</Link>
        {brand && model ? <p className="text-sm text-gray-500">{brand} · {model}</p> : null}
        {!brand && !model && category ? <p className="text-sm text-gray-500">{category}</p> : null}
        <p className="text-sm text-amber-500">★★★★★ <span className="text-gray-400">(4.8)</span></p>
        <p className="text-gray-900 font-black">Rs. {(price / 100).toLocaleString()} {featured && <span className="ml-1 text-xs font-normal text-gray-400 line-through">Rs. {(price / 90).toFixed(0)}</span>}</p>
        <p className={`text-sm ${isOutOfStock ? "text-gray-500" : "text-green-600"}`}>{availabilityText}</p>
        <motion.button
          onClick={handleAdd}
          whileTap={{ scale: 0.95 }}
          transition={{ duration: DUR.micro, ease: EASE_OUT_EXPO }}
          className={`relative mt-1.5 h-8 overflow-hidden rounded-lg text-[11px] font-bold text-white transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-60 ${added ? "bg-emerald-600" : "bg-slate-950 hover:bg-violet-700"}`}
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
