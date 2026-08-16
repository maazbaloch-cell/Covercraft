"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useCart } from "@/lib/cartStore";
import { resolveProductImage } from "@/lib/productImage";
import { ProductCardSkeleton } from "@/components/Skeleton";
import { DUR, EASE_OUT_EXPO, viewportOnce } from "@/lib/motion";

interface WishlistEntry {
  id: string;
  productId: string;
  product: { id: string; title: string; price: number; imageUrl: string; category: string | null; brand: string | null; model: string | null; stock: number; isAvailable: boolean };
}

export default function WishlistPage() {
  const router = useRouter();
  const addItem = useCart((s) => s.addItem);
  const [items, setItems] = useState<WishlistEntry[] | null>(null);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");

  const load = async () => {
    try {
      const res = await fetch("/api/customer/wishlist", { credentials: "include" });
      if (res.status === 401) return router.replace("/account");
      const body = await res.json().catch(() => ({}));
      if (!res.ok) return setError(body.error || "Unable to load your wishlist.");
      setItems(body.items || []);
    } catch {
      setError("Unable to load your wishlist. Please try again.");
    }
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps -- load the wishlist once on mount
  useEffect(() => { void load(); }, []);

  const remove = async (productId: string) => {
    setItems((prev) => prev?.filter((i) => i.productId !== productId) ?? prev); // optimistic
    try {
      await fetch(`/api/customer/wishlist?productId=${encodeURIComponent(productId)}`, { method: "DELETE", credentials: "include" });
    } catch {
      void load(); // reload to resync if the delete failed
    }
  };

  const addToCart = (entry: WishlistEntry) => {
    addItem({ productId: entry.product.id, title: entry.product.title, price: entry.product.price, imageUrl: entry.product.imageUrl });
    setNote(`${entry.product.title} added to your cart.`);
    window.setTimeout(() => setNote(""), 2500);
  };

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.2em] text-violet-700">Your CoverCraft account</p>
          <h1 className="mt-2 text-3xl font-black text-slate-950">Saved covers</h1>
        </div>
        <Link href="/account/dashboard" className="text-sm font-bold text-violet-700">← Back to account</Link>
      </div>

      <AnimatePresence initial={false}>
        {note && <motion.p key={note} initial={{ opacity: 0, height: 0, y: -4 }} animate={{ opacity: 1, height: "auto", y: 0 }} exit={{ opacity: 0, height: 0 }} transition={{ duration: DUR.base, ease: EASE_OUT_EXPO }} className="mt-5 overflow-hidden rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{note}</motion.p>}
      </AnimatePresence>
      {error && <p className="mt-5 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}

      {items === null && !error && (
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <ProductCardSkeleton key={i} />)}
        </div>
      )}

      {items !== null && items.length === 0 && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: DUR.section, ease: EASE_OUT_EXPO }} className="mt-8 flex min-h-72 flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-slate-50 text-center">
          <span className="text-5xl">♡</span>
          <h2 className="mt-4 text-xl font-black text-slate-950">No saved covers yet</h2>
          <p className="mt-2 max-w-sm text-sm text-slate-500">Tap the heart on any cover to save it here for later.</p>
          <Link href="/" className="mt-5 rounded-full bg-slate-950 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-violet-700">Browse the collection</Link>
        </motion.div>
      )}

      {items !== null && items.length > 0 && (
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence initial={false}>
          {items.map((entry, i) => {
            const isOut = entry.product.stock <= 0 || entry.product.isAvailable === false;
            return (
              <motion.div
                key={entry.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.92, transition: { duration: DUR.base, ease: EASE_OUT_EXPO } }}
                transition={{ duration: DUR.base, ease: EASE_OUT_EXPO, delay: (i % 3) * 0.05 }}
                whileHover={{ y: -5 }}
                className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow duration-300 hover:shadow-lg"
              >
                <Link href={`/products/${entry.product.id}`} className="relative block aspect-[4/3] overflow-hidden bg-slate-100">
                  <Image src={resolveProductImage(entry.product.imageUrl)} alt={entry.product.title} fill sizes="(max-width: 640px) 100vw, 33vw" className="object-cover transition-transform duration-500 ease-out group-hover:scale-105" />
                </Link>
                <div className="flex flex-1 flex-col gap-1.5 p-4">
                  {entry.product.category && <span className="text-xs uppercase tracking-wide text-violet-700">{entry.product.category}</span>}
                  <Link href={`/products/${entry.product.id}`} className="line-clamp-1 text-sm font-bold text-slate-900 transition hover:text-violet-700">{entry.product.title}</Link>
                  <p className="font-black text-slate-900">Rs. {(entry.product.price / 100).toLocaleString()}</p>
                  <p className={`text-xs font-semibold ${isOut ? "text-rose-600" : "text-emerald-600"}`}>{isOut ? "Out of stock" : "In stock"}</p>
                  <div className="mt-3 flex gap-2">
                    <motion.button whileTap={{ scale: 0.96 }} onClick={() => addToCart(entry)} disabled={isOut} className="flex-1 rounded-lg bg-slate-950 py-2 text-xs font-bold text-white transition-colors hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50">
                      {isOut ? "Unavailable" : "Add to cart"}
                    </motion.button>
                    <motion.button whileTap={{ scale: 0.94 }} onClick={() => remove(entry.productId)} aria-label={`Remove ${entry.product.title} from wishlist`} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 transition-colors hover:border-rose-300 hover:text-rose-600">
                      Remove
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            );
          })}
          </AnimatePresence>
        </div>
      )}
    </main>
  );
}
