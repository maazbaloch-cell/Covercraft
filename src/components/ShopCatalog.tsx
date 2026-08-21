"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import ProductCard from "@/components/ProductCard";
import NewsletterForm from "@/components/NewsletterForm";
import Reveal from "@/components/Reveal";
import ShopHero from "@/components/ShopHero";

export type CatalogProduct = { id: string; title: string; description: string | null; imageUrl: string; price: number; category: string | null; brand: string | null; model: string | null; stock: number; isAvailable: boolean; createdAt: Date };
const CATEGORY_ICONS = ["✦", "◒", "◇", "◌", "⊙", "✺", "♛", "↗"];

export default function ShopCatalog({ products }: { products: CatalogProduct[] }) {
  const params = useSearchParams(); const router = useRouter(); const pathname = usePathname();
  // Derived from the real catalogue so the category tiles actually filter and no
  // product can ever be priced out of the slider's range.
  const categories = useMemo(() => [...new Set(products.map((p) => p.category).filter(Boolean))] as string[], [products]);
  const priceMax = useMemo(() => { const top = products.reduce((m, p) => Math.max(m, p.price), 0); return top > 0 ? Math.ceil(top / 10000) * 10000 : 250000; }, [products]);
  const [query, setQueryInput] = useState(""); const [brand, setBrand] = useState("all"); const [sort, setSort] = useState("newest"); const [maxPrice, setMaxPrice] = useState(priceMax); const [inStockOnly, setInStockOnly] = useState(false); const [filters, setFilters] = useState(false); const [activeCategory, setActiveCategory] = useState(params.get("category") || "");
  const [wishlistIds, setWishlistIds] = useState<Set<string>>(new Set());
  // One request builds the set of already-saved product IDs so hearts render filled.
  // A 401 (signed-out visitor) just leaves the set empty; clicking a heart then routes to /account.
  useEffect(() => { let alive = true; fetch("/api/customer/wishlist", { credentials: "include" }).then((r) => (r.ok ? r.json() : null)).then((d) => { if (alive && d?.items) setWishlistIds(new Set(d.items.map((i: { productId: string }) => i.productId))); }).catch(() => {}); return () => { alive = false; }; }, []);
  const brands = [...new Set(products.map(p => p.brand).filter(Boolean))] as string[];
  const visible = useMemo(() => [...products.filter(p => `${p.title} ${p.category || ""} ${p.brand || ""} ${p.model || ""}`.toLowerCase().includes(query.toLowerCase()) && (brand === "all" || p.brand === brand) && p.price <= maxPrice && (!inStockOnly || (p.stock > 0 && p.isAvailable)) && (!activeCategory || p.category === activeCategory))].sort((a,b) => sort === "low" ? a.price-b.price : sort === "high" ? b.price-a.price : +new Date(b.createdAt)-+new Date(a.createdAt)), [products, query, brand, maxPrice, inStockOnly, sort, activeCategory]);
  const selectCategory = (category: string) => { const next = activeCategory === category ? "" : category; setActiveCategory(next); const search = new URLSearchParams(params.toString()); if (next) search.set("category", next); else search.delete("category"); router.replace(`${pathname}${search.size ? `?${search}` : ""}`, { scroll: false }); document.getElementById("catalogue")?.scrollIntoView({ behavior: "smooth" }); };
  const clear = () => { setQueryInput(""); setBrand("all"); setMaxPrice(priceMax); setInStockOnly(false); if (activeCategory) selectCategory(activeCategory); };

  return (
    <div className="cinematic-scene relative isolate overflow-x-clip">
      {/* One continuous atmosphere for the ENTIRE page. A soft brand-blue glow settles
          high (behind the hero) and melts smoothly into the dark base — no hard edge, no
          band, no bottom-anchored radial, no height cap. Full-page (inset-0), so the whole
          catalogue (hero → grid → footer) reads as a single cinematic dark-navy space.
          Depth here is pure soft radial light layered on the .cinematic-scene base — never
          a colour block. (The old wash was capped at h-[78vh] with a blue radial anchored
          on its bottom edge, which cut the page into a brighter upper and darker lower half
          right where the hero ends — that is the seam this replaces.) */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(75% 55% at 22% 10%, rgb(37 99 235 / 0.16), transparent 60%), radial-gradient(65% 48% at 82% 16%, rgb(56 189 248 / 0.08), transparent 60%)",
        }}
      />
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-grain opacity-[0.12]" />

      {/* Hero — realistic WebGL phone on a dock stand, wrapped by an animated ring. */}
      <ShopHero />

      {/* Shop by category — derived from the live catalogue so every tile filters. */}
      {categories.length > 0 && (
        <section className="px-6 py-16">
          <div className="mx-auto max-w-7xl">
            <p className="text-xs font-bold uppercase tracking-[.24em] text-accent-300">Shop by category</p>
            <div className="mb-8 flex items-end justify-between">
              <h2 className="font-display text-2xl font-black tracking-cinema text-white sm:text-3xl">Explore the collection</h2>
              <span className="text-sm text-slate-400">Protection, with personality.</span>
            </div>
            <Reveal>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
                {categories.map((name, i) => {
                  const active = activeCategory === name;
                  return (
                    <button key={name} onClick={() => selectCategory(name)} aria-pressed={active} className={`group glass rounded-2xl p-4 text-left transition duration-300 hover:-translate-y-1 hover:border-accent-400/50 hover:shadow-glow-sm ${active ? "border-accent-400/60 shadow-glow-sm" : ""}`}>
                      <span className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl text-lg transition ${active ? "bg-accent-600 text-white" : "bg-white/10 text-accent-300 group-hover:bg-accent-600 group-hover:text-white"}`}>{CATEGORY_ICONS[i % CATEGORY_ICONS.length]}</span>
                      <b className="block text-sm text-white">{name}</b>
                      <small className="mt-1 block text-slate-400">{active ? "Showing this edit" : "Discover the edit"}</small>
                    </button>
                  );
                })}
              </div>
            </Reveal>
          </div>
        </section>
      )}

      {/* Catalogue: search / filters / grid */}
      <section id="catalogue" className="scroll-mt-20 py-16">
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
              <input value={query} onChange={e=>setQueryInput(e.target.value)} aria-label="Search covers" placeholder="Search by style, phone model, or brand" className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500" />
            </label>
            <select value={sort} onChange={e=>setSort(e.target.value)} className="rounded-xl border border-white/10 bg-ink-800 px-4 py-3 text-sm text-white outline-none [color-scheme:dark]"><option value="newest">Newest arrivals</option><option value="low">Price: low to high</option><option value="high">Price: high to low</option></select>
            <button onClick={()=>setFilters(!filters)} className="rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-bold text-white lg:hidden">Filters</button>
          </div>
          <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
            <aside className={`${filters ? "block" : "hidden"} glass h-fit rounded-2xl p-5 lg:block`}>
              <div className="flex justify-between text-white"><b>Refine results</b><button onClick={clear} className="text-xs font-bold text-accent-300 transition hover:text-accent-400">Clear all</button></div>
              <label className="mt-5 block border-t border-white/10 pt-5 text-sm font-bold text-white">Brand<select value={brand} onChange={e=>setBrand(e.target.value)} className="mt-2 w-full rounded-lg border border-white/10 bg-ink-800 p-2 text-sm font-normal text-white outline-none [color-scheme:dark]"><option value="all">All brands</option>{brands.map(b=><option key={b}>{b}</option>)}</select></label>
              <label className="mt-5 block border-t border-white/10 pt-5 text-sm font-bold text-white">Up to Rs. {(maxPrice/100).toLocaleString()}<input type="range" min="0" max={priceMax} step="10000" value={maxPrice} onChange={e=>setMaxPrice(+e.target.value)} className="mt-3 w-full accent-accent-500"/></label>
              <div className="mt-5 border-t border-white/10 pt-5 text-sm text-white"><b>Availability</b><label className="mt-3 flex cursor-pointer items-center gap-2 font-normal text-slate-300"><input type="checkbox" checked={inStockOnly} onChange={e=>setInStockOnly(e.target.checked)} className="h-4 w-4 accent-accent-500"/>In stock only</label></div>
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
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-accent-700 to-accent-500 px-7 py-11 text-white shadow-depth">
              <div aria-hidden className="pointer-events-none absolute inset-0 bg-grain opacity-10" />
              <p className="text-xs font-bold uppercase tracking-[.24em] text-blue-200">Members get more</p>
              <div className="mt-3 flex flex-col justify-between gap-5 md:flex-row md:items-end">
                <div>
                  <h2 className="font-display text-3xl font-black tracking-cinema">A little inspiration, delivered.</h2>
                  <p className="mt-2 text-sm text-blue-100">New drops, private offers and design stories — no noise.</p>
                </div>
                <NewsletterForm className="shrink-0" inputClassName="min-w-0 flex-1 rounded-xl px-4 py-3 text-sm text-slate-900 outline-none" buttonClassName="shrink-0 rounded-xl bg-ink-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-ink-800 disabled:opacity-60" messageClassName="text-blue-50"/>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
