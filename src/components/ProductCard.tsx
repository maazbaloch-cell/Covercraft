"use client";

import Image from "next/image";
import { useState } from "react";
import { useCart } from "@/lib/cartStore";
import { useRouter } from "next/navigation";

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
}

export default function ProductCard({ id, title, price, imageUrl, category, brand, model, stock, isAvailable, featured }: Props) {
  const addItem = useCart((s) => s.addItem);
  const router = useRouter();
  const [imageFailed, setImageFailed] = useState(false);

  // Older database records referenced JPGs that were not included with the project.
  // Keep those existing records working while new products can use their own image URLs.
  const legacyImages: Record<string, string> = {
    "/products/marble-swirl.jpg": "/products/marble-swirl.svg",
    "/products/neon-cyberpunk.jpg": "/products/neon-cyberpunk.svg",
    "/products/minimal-wave.jpg": "/products/minimal-wave.svg",
    "/products/floral-bloom.jpg": "/products/floral-bloom.svg",
  };
  const displayImageUrl = imageFailed ? "/products/placeholder.svg" : legacyImages[imageUrl] || imageUrl || "/products/placeholder.svg";

  const isOutOfStock = typeof stock === "number" && stock <= 0;
  const availabilityText = isOutOfStock ? "Out of Stock" : isAvailable === false ? "Unavailable" : "Available";

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-[1.15rem] border border-slate-200/90 bg-white shadow-[0_3px_14px_rgb(15_23_42_/_0.05)] transition duration-300 hover:-translate-y-1 hover:border-violet-200 hover:shadow-[0_14px_28px_rgb(15_23_42_/_0.12)]">
      <div className="relative aspect-[4/4.35] overflow-hidden bg-slate-100">
        <Image src={displayImageUrl} alt={title} fill sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw" className="object-cover transition duration-500 ease-out group-hover:scale-[1.045]" onError={() => setImageFailed(true)} />
        {featured && <span className="absolute left-3 top-3 rounded-full bg-violet-600 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-white">New</span>}
        <button aria-label={`Add ${title} to wishlist`} className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow transition hover:bg-slate-950 hover:text-white">♡</button>
      </div>
      <div className="p-3 flex flex-col gap-1.5">
        {category && <span className="text-xs text-brand-accent uppercase tracking-wide">{category}</span>}
        <h3 className="line-clamp-1 text-sm font-bold text-slate-900">{title}</h3>
        {brand && model ? <p className="text-sm text-gray-500">{brand} · {model}</p> : null}
        {!brand && !model && category ? <p className="text-sm text-gray-500">{category}</p> : null}
        <p className="text-sm text-amber-500">★★★★★ <span className="text-gray-400">(4.8)</span></p>
        <p className="text-gray-900 font-black">Rs. {(price / 100).toLocaleString()} {featured && <span className="ml-1 text-xs font-normal text-gray-400 line-through">Rs. {(price / 90).toFixed(0)}</span>}</p>
        <p className={`text-sm ${isOutOfStock ? "text-gray-500" : "text-green-600"}`}>{availabilityText}</p>
        <button
          onClick={() => {
            addItem({ productId: id, title, price, imageUrl });
            router.push("/cart");
          }}
          className="mt-1.5 rounded-lg bg-slate-950 py-2 text-[11px] font-bold text-white transition duration-200 hover:bg-violet-700 active:scale-[.98]"
          disabled={isOutOfStock}
        >
          {isOutOfStock ? "Out of Stock" : "Add to Cart"}
        </button>
      </div>
    </div>
  );
}
