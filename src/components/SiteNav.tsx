"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useAnimationControls } from "framer-motion";
import { useCart } from "@/lib/cartStore";
import { EASE_OUT_EXPO } from "@/lib/motion";
import AdminNav from "./AdminNav";

const LINKS = [
  { href: "/shop", label: "Shop" },
  { href: "/customize-cover", label: "Customize" },
  { href: "/track", label: "Track Order" },
  { href: "/account", label: "Account" },
  { href: "/complaint", label: "Support" },
];

/**
 * Client navigation cluster: desktop link row, an animated cart badge, and a
 * mobile slide-in drawer. Cart count is read from the persisted store behind a
 * `mounted` guard so SSR markup matches the first client render (no hydration
 * mismatch), then the badge animates as items are added.
 */
export default function SiteNav() {
  const items = useCart((s) => s.items);
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const count = mounted ? items.reduce((sum, i) => sum + i.quantity, 0) : 0;
  const asideRef = useRef<HTMLElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => setMounted(true), []);
  // Close the drawer whenever navigation lands on a new route.
  useEffect(() => setOpen(false), [pathname]);
  // While the drawer is open: lock body scroll, trap focus inside it, and on
  // close restore focus to whatever opened it (WCAG 2.4.3 Focus Order / 2.1.2
  // No Keyboard Trap). Escape and backdrop-click still close it.
  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const opener = (triggerRef.current ?? document.activeElement) as HTMLElement | null;
    const getFocusable = () =>
      asideRef.current
        ? Array.from(
            asideRef.current.querySelectorAll<HTMLElement>(
              'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
            )
          )
        : [];
    // Move focus into the drawer (its first control) so keyboard users start inside.
    getFocusable()[0]?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setOpen(false); return; }
      if (e.key !== "Tab") return;
      const els = getFocusable();
      if (els.length === 0) return;
      const first = els[0];
      const last = els[els.length - 1];
      const active = document.activeElement;
      // Wrap focus at the edges and pull it back in if it ever escapes the drawer.
      if (e.shiftKey && (active === first || !asideRef.current?.contains(active))) {
        e.preventDefault(); last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault(); first.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
      // Return focus to the trigger so keyboard users aren't dropped at page top.
      opener?.focus?.();
    };
  }, [open]);

  // Bounce the cart icon each time the item count grows (add-to-cart feedback).
  const controls = useAnimationControls();
  const prevCount = useRef(count);
  useEffect(() => {
    if (count > prevCount.current) {
      void controls.start({ scale: [1, 1.28, 0.92, 1], transition: { duration: 0.45, ease: EASE_OUT_EXPO } });
    }
    prevCount.current = count;
  }, [count, controls]);

  const cartIcon = (
    <span className="relative inline-flex">
      <motion.span animate={controls} className="inline-flex" aria-hidden>
        <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" /></svg>
      </motion.span>
      <AnimatePresence>
        {count > 0 && (
          <motion.span
            key="cart-badge"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.24, ease: EASE_OUT_EXPO }}
            className="absolute -right-2.5 -top-2.5 flex h-[1.125rem] min-w-[1.125rem] items-center justify-center rounded-full bg-accent-500 px-1 text-[10px] font-black leading-none text-white"
          >
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span key={count} initial={{ y: -8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 8, opacity: 0 }} transition={{ duration: 0.18, ease: EASE_OUT_EXPO }}>{count}</motion.span>
            </AnimatePresence>
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );

  return (
    <>
      {/* Desktop */}
      <nav className="hidden items-center gap-5 text-sm font-semibold text-slate-200 md:flex">
        {LINKS.map((l) => {
          const active = pathname === l.href;
          return (
            <Link key={l.href} href={l.href} aria-current={active ? "page" : undefined} className={`relative transition-colors hover:text-white ${active ? "text-white after:absolute after:-bottom-1 after:left-0 after:h-0.5 after:w-full after:rounded-full after:bg-accent-400" : ""}`}>{l.label}</Link>
          );
        })}
        <AdminNav />
        <Link href="/cart" aria-label={`Cart${count ? `, ${count} items` : ""}`} className="ml-1 flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-white transition-colors hover:bg-white/20">
          {cartIcon}
          <span className="text-xs font-bold">Cart</span>
        </Link>
      </nav>

      {/* Mobile: cart + hamburger */}
      <div className="flex items-center gap-3 md:hidden">
        <Link href="/cart" aria-label={`Cart${count ? `, ${count} items` : ""}`} className="flex items-center text-white">{cartIcon}</Link>
        <button
          type="button"
          ref={triggerRef}
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          aria-expanded={open}
          aria-controls="mobile-menu"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-white transition-colors hover:bg-white/10 active:scale-95"
        >
          <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M3 6h18M3 12h18M3 18h18" /></svg>
        </button>
      </div>

      {/* Mobile slide-in drawer + backdrop */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-50 md:hidden"
            initial="closed"
            animate="open"
            exit="closed"
          >
            <motion.div
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
              variants={{ open: { opacity: 1 }, closed: { opacity: 0 } }}
              transition={{ duration: 0.25, ease: EASE_OUT_EXPO }}
              onClick={() => setOpen(false)}
            />
            <motion.aside
              ref={asideRef}
              id="mobile-menu"
              role="dialog"
              aria-modal="true"
              aria-label="Menu"
              className="absolute right-0 top-0 flex h-full w-72 max-w-[80vw] flex-col bg-slate-950 px-6 py-5 text-white shadow-2xl"
              variants={{ open: { x: 0 }, closed: { x: "100%" } }}
              transition={{ duration: 0.32, ease: EASE_OUT_EXPO }}
            >
              <div className="flex items-center justify-between">
                <span className="text-lg font-black tracking-tight">Menu</span>
                <button type="button" onClick={() => setOpen(false)} aria-label="Close menu" className="flex h-9 w-9 items-center justify-center rounded-lg text-2xl leading-none text-slate-300 transition-colors hover:bg-white/10 active:scale-95">×</button>
              </div>
              <motion.nav
                className="mt-6 flex flex-col gap-1"
                variants={{ open: { transition: { staggerChildren: 0.05, delayChildren: 0.08 } }, closed: {} }}
              >
                {[...LINKS, { href: "/cart", label: "Cart" }, { href: "/admin", label: "Dashboard" }].map((l) => (
                  <motion.div key={l.href} variants={{ open: { opacity: 1, x: 0 }, closed: { opacity: 0, x: 24 } }} transition={{ duration: 0.3, ease: EASE_OUT_EXPO }}>
                    <Link href={l.href} aria-current={pathname === l.href ? "page" : undefined} className={`block rounded-xl px-4 py-3 text-base font-bold transition-colors hover:bg-white/10 ${pathname === l.href ? "bg-white/10 text-white" : "text-slate-200"}`}>{l.label}</Link>
                  </motion.div>
                ))}
              </motion.nav>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
