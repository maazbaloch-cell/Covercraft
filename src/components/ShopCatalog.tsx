"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import ProductCard from "@/components/ProductCard";
import NewsletterForm from "@/components/NewsletterForm";
import Reveal from "@/components/Reveal";
import { staggerContainer, lineChild, DUR, DUR_CINEMA, EASE_OUT_EXPO, EASE_CINEMATIC } from "@/lib/motion";

export type CatalogProduct = { id: string; title: string; description: string | null; imageUrl: string; price: number; category: string | null; brand: string | null; model: string | null; stock: number; isAvailable: boolean; createdAt: Date };
const cards = [["Premium Covers", "✦"], ["Silicone Covers", "◒"], ["Leather Covers", "◇"], ["Transparent", "◌"], ["MagSafe Ready", "⊙"], ["Printed Covers", "✺"], ["Luxury Collection", "♛"], ["New Arrivals", "↗"]];

export default function ShopCatalog({ products }: { products: CatalogProduct[] }) {
  const params = useSearchParams(); const router = useRouter(); const pathname = usePathname();
  const [query, setQueryInput] = useState(""); const [brand, setBrand] = useState("all"); const [sort, setSort] = useState("newest"); const [maxPrice, setMaxPrice] = useState(250000); const [filters, setFilters] = useState(false); const [activeCategory, setActiveCategory] = useState(params.get("category") || "");
  const [wishlistIds, setWishlistIds] = useState<Set<string>>(new Set());
  // One request builds the set of already-saved product IDs so hearts render filled.
  // A 401 (signed-out visitor) just leaves the set empty; clicking a heart then routes to /account.
  useEffect(() => { let alive = true; fetch("/api/customer/wishlist", { credentials: "include" }).then((r) => (r.ok ? r.json() : null)).then((d) => { if (alive && d?.items) setWishlistIds(new Set(d.items.map((i: { productId: string }) => i.productId))); }).catch(() => {}); return () => { alive = false; }; }, []);
  const brands = [...new Set(products.map(p => p.brand).filter(Boolean))] as string[];
  const visible = useMemo(() => [...products.filter(p => `${p.title} ${p.category || ""} ${p.brand || ""} ${p.model || ""}`.toLowerCase().includes(query.toLowerCase()) && (brand === "all" || p.brand === brand) && p.price <= maxPrice && (!activeCategory || p.category === activeCategory))].sort((a,b) => sort === "low" ? a.price-b.price : sort === "high" ? b.price-a.price : +new Date(b.createdAt)-+new Date(a.createdAt)), [products, query, brand, maxPrice, sort, activeCategory]);
  const selectCategory = (category: string) => { const next = activeCategory === category ? "" : category; setActiveCategory(next); const search = new URLSearchParams(params.toString()); if (next) search.set("category", next); else search.delete("category"); router.replace(`${pathname}${search.size ? `?${search}` : ""}`, { scroll: false }); document.getElementById("catalogue")?.scrollIntoView({ behavior: "smooth" }); };
  const setQuery = (value: string) => { const category = cards.find(([name]) => name.replace(" Covers", "") === value)?.[0]; if (category) { selectCategory(category); setQueryInput(""); } else setQueryInput(value); };
  const clear = () => { setQueryInput(""); setBrand("all"); setMaxPrice(250000); if (activeCategory) selectCategory(activeCategory); };

  return (
    <div className="cinematic-scene relative isolate overflow-x-clip">
      {/* One ambient wash for the whole catalogue — the emerald arrival (Phase 6) settles onto this. */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[78vh] bg-aurora opacity-80" />
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-grain opacity-[0.12]" />

      {/* Hero */}
      <section className="relative isolate overflow-hidden">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 py-20 md:grid-cols-2 md:items-center md:py-28">
          <motion.div variants={staggerContainer} initial="hidden" animate="show">
            <motion.p variants={lineChild} className="text-xs font-bold uppercase tracking-[.28em] text-accent-300">The CoverCraft edit · 2026</motion.p>
            <motion.h1 variants={lineChild} className="mt-5 font-display text-4xl font-black leading-[1.02] tracking-cinema text-white sm:text-6xl">Made to protect.<br /><span className="text-gradient">Designed to be seen.</span></motion.h1>
            <motion.p variants={lineChild} className="mt-6 max-w-lg leading-7 text-slate-300">Premium mobile covers for the device you carry everywhere. Find a signature look without compromising protection.</motion.p>
            <motion.a variants={lineChild} href="#catalogue" whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.98 }} transition={{ duration: DUR.micro, ease: EASE_OUT_EXPO }} className="group mt-9 inline-flex items-center rounded-full bg-white px-7 py-3.5 text-sm font-bold text-ink-950 shadow-glow">Shop the collection<span className="ml-2 transition-transform duration-200 group-hover:translate-x-1">→</span></motion.a>
          </motion.div>
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: DUR_CINEMA.entrance, ease: EASE_CINEMATIC, delay: 0.18 }} className="relative mx-auto h-72 w-72 sm:h-80 sm:w-80">
            <div className="absolute inset-6 rotate-6 rounded-[2.8rem] bg-gradient-to-br from-accent-500 to-fuchsia-500 opacity-90 blur-[2px]" />
            <div className="glow-ring absolute inset-0 -rotate-6 rounded-[2.8rem] border border-white/15 bg-ink-800 p-3">
              <div className="h-full rounded-[2.3rem] bg-[radial-gradient(circle_at_30%_20%,#67e8f9,transparent_24%),linear-gradient(145deg,#1e1b4b,#312e81_50%,#0b0f1e)]" />
            </div>
            <motion.span initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: DUR.base, ease: EASE_OUT_EXPO, delay: 0.6 }} className="absolute -right-6 top-12 rounded-full bg-amber-300 px-4 py-2 text-xs font-black text-amber-950 shadow-lg">UP TO 20% OFF</motion.span>
          </motion.div>
        </div>
      </section>

      {/* Mood categories */}
      <section className="border-t border-white/5 px-6 py-16">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-bold uppercase tracking-[.24em] text-accent-300">Shop your mood</p>
          <div className="mb-8 flex items-end justify-between">
            <h2 className="font-display text-2xl font-black tracking-cinema text-white sm:text-3xl">Explore the collection</h2>
            <span className="text-sm text-slate-400">Protection, with personality.</span>
          </div>
          <Reveal>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
              {cards.map(([name, icon]) => (
                <button key={name} onClick={() => { setQuery(name === "New Arrivals" ? "" : name.replace(" Covers", "")); document.getElementById("catalogue")?.scrollIntoView({ behavior: "smooth" }); }} className="group glass rounded-2xl p-4 text-left transition duration-300 hover:-translate-y-1 hover:border-accent-400/50 hover:shadow-glow-sm">
                  <span className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-lg text-accent-300 transition group-hover:bg-accent-600 group-hover:text-white">{icon}</span>
                  <b className="block text-sm text-white">{name}</b>
                  <small className="mt-1 block text-slate-400">Discover the edit</small>
                </button>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* Catalogue: search / filters / grid */}
      <section id="catalogue" className="scroll-mt-20 border-t border-white/5 py-16">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[.24em] text-accent-300">Curated for you</p>
              <h2 className="mt-1 font-display text-3xl font-black tracking-cinema text-white">Find your perfect cover</h2>
            </div>
            <span className="text-sm text-slate-400">{visible.length} styles found</span>
          </div>
          <div className="my-8 flex flex-col gap-3 lg:flex-row">
            <label className="glass flex flex-1 items-center gap-3 rounded-xl px-4 py-3">
              <span className="text-accent-300">⌕</span>
              <input value={query} onChange={e=>setQuery(e.target.value)} aria-label="Search covers" placeholder="Search by style, phone model, or brand" className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500" />
            </label>
            <select value={sort} onChange={e=>setSort(e.target.value)} className="rounded-xl border border-white/10 bg-ink-800 px-4 py-3 text-sm text-white outline-none [color-scheme:dark]"><option value="newest">Newest arrivals</option><option value="low">Price: low to high</option><option value="high">Price: high to low</option></select>
            <button onClick={()=>setFilters(!filters)} className="rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-bold text-white lg:hidden">Filters</button>
          </div>
          <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
            <aside className={`${filters ? "block" : "hidden"} glass h-fit rounded-2xl p-5 lg:block`}>
              <div className="flex justify-between text-white"><b>Refine results</b><button onClick={clear} className="text-xs font-bold text-accent-300 transition hover:text-accent-400">Clear all</button></div>
              <label className="mt-5 block border-t border-white/10 pt-5 text-sm font-bold text-white">Brand<select value={brand} onChange={e=>setBrand(e.target.value)} className="mt-2 w-full rounded-lg border border-white/10 bg-ink-800 p-2 text-sm font-normal text-white outline-none [color-scheme:dark]"><option value="all">All brands</option>{brands.map(b=><option key={b}>{b}</option>)}</select></label>
              <label className="mt-5 block border-t border-white/10 pt-5 text-sm font-bold text-white">Up to Rs. {(maxPrice/100).toLocaleString()}<input type="range" min="0" max="250000" step="10000" value={maxPrice} onChange={e=>setMaxPrice(+e.target.value)} className="mt-3 w-full accent-violet-500"/></label>
              <div className="mt-5 border-t border-white/10 pt-5 text-sm text-white"><b>Availability</b><p className="mt-3 text-slate-400">✓ In stock</p><p className="mt-2 text-slate-400">★★★★★ &amp; up</p></div>
            </aside>
            <div>{visible.length ? <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">{visible.map((p,i)=><ProductCard key={p.id} {...p} index={i} featured={i<2} wishlisted={wishlistIds.has(p.id)}/>)}</div> : <div className="flex min-h-80 flex-col items-center justify-center rounded-3xl border border-dashed border-white/15 bg-white/[0.03] text-center text-white"><span className="text-5xl text-accent-300">⌕</span><h3 className="mt-4 font-display text-xl font-black">Nothing matches that search</h3><p className="mt-2 text-sm text-slate-400">Try changing a filter, or discover the full collection.</p><button onClick={clear} className="mt-5 rounded-full bg-white px-5 py-2.5 text-sm font-bold text-ink-950">View all covers</button></div>}</div>
          </div>
        </div>
      </section>

      {/* Trust badges */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-7xl">
          <Reveal>
            <div className="glass grid gap-4 rounded-3xl p-7 sm:grid-cols-2 lg:grid-cols-5">{[["▣","Secure payment","Protected checkout"],["↗","Fast dispatch","Across Pakistan"],["↶","Easy returns","Hassle-free support"],["✦","Premium quality","Made to last"],["◌","Here to help","7 days a week"]].map(([i,t,c])=><div key={t} className="flex items-center gap-3"><span className="rounded-full bg-accent-600/20 p-3 text-accent-300">{i}</span><p><b className="block text-sm text-white">{t}</b><small className="text-slate-400">{c}</small></p></div>)}</div>
          </Reveal>
        </div>
      </section>

      {/* Newsletter */}
      <section className="px-6 pb-20">
        <div className="mx-auto max-w-7xl">
          <Reveal>
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-accent-700 to-indigo-600 px-7 py-11 text-white shadow-depth">
              <div aria-hidden className="pointer-events-none absolute inset-0 bg-grain opacity-10" />
              <p className="text-xs font-bold uppercase tracking-[.24em] text-violet-200">Members get more</p>
              <div className="mt-3 flex flex-col justify-between gap-5 md:flex-row md:items-end">
                <div>
                  <h2 className="font-display text-3xl font-black tracking-cinema">A little inspiration, delivered.</h2>
                  <p className="mt-2 text-sm text-violet-100">New drops, private offers and design stories — no noise.</p>
                </div>
                <NewsletterForm className="shrink-0" inputClassName="min-w-0 flex-1 rounded-xl px-4 py-3 text-sm text-slate-900 outline-none" buttonClassName="shrink-0 rounded-xl bg-ink-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-ink-800 disabled:opacity-60" messageClassName="text-violet-50"/>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
