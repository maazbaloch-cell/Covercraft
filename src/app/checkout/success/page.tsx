"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense, useEffect } from "react";
import { motion } from "framer-motion";
import { useCart } from "@/lib/cartStore";
import { DUR, EASE_OUT_EXPO, fadeInUp, staggerContainer } from "@/lib/motion";

// Deterministic "confetti-lite" burst (no randomness → no SSR hydration mismatch).
const CONFETTI = [
  { x: -64, y: -26, c: "#7c3aed", d: 0.30 },
  { x: 66, y: -34, c: "#f59e0b", d: 0.34 },
  { x: -40, y: -66, c: "#10b981", d: 0.38 },
  { x: 44, y: -64, c: "#0ea5e9", d: 0.30 },
  { x: -78, y: 16, c: "#ec4899", d: 0.42 },
  { x: 80, y: 10, c: "#8b5cf6", d: 0.36 },
  { x: -20, y: -84, c: "#f43f5e", d: 0.46 },
  { x: 24, y: -82, c: "#22c55e", d: 0.40 },
];

function SuccessContent() {
  const params = useSearchParams();
  const orderNumber = params.get("order");
  const clear = useCart((s) => s.clear);

  useEffect(() => {
    clear();
  }, [clear]);

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="show" className="mx-auto flex max-w-lg flex-col items-center px-6 py-16 text-center sm:py-24">
      <motion.div variants={fadeInUp} className="relative">
        {/* Confetti-lite burst around the checkmark */}
        {CONFETTI.map((p, idx) => (
          <motion.span
            key={idx}
            className="absolute left-1/2 top-1/2 h-2 w-2 rounded-[2px]"
            style={{ backgroundColor: p.c }}
            initial={{ opacity: 0, x: 0, y: 0, scale: 0 }}
            animate={{ opacity: [0, 1, 1, 0], x: p.x, y: p.y, scale: [0, 1, 1, 0.5], rotate: p.x > 0 ? 180 : -180 }}
            transition={{ duration: 0.9, ease: EASE_OUT_EXPO, delay: p.d }}
            aria-hidden
          />
        ))}
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.4, ease: [0.34, 1.56, 0.64, 1], delay: 0.05 }}
          className="relative flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600"
        >
          <svg viewBox="0 0 52 52" className="h-8 w-8" fill="none">
            <motion.path d="M14 27l8 8 16-18" stroke="currentColor" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.45, ease: EASE_OUT_EXPO, delay: 0.28 }} />
          </svg>
        </motion.span>
      </motion.div>
      <motion.h1 variants={fadeInUp} className="mt-6 text-3xl font-black tracking-tight text-slate-950">Payment successful</motion.h1>
      {orderNumber && (
        <motion.p variants={fadeInUp} className="mt-3 text-slate-600">
          Your order <b className="font-bold text-slate-950">{orderNumber}</b> has been confirmed.
        </motion.p>
      )}
      <motion.p variants={fadeInUp} className="mt-2 leading-7 text-slate-500">
        A confirmation email and WhatsApp message are on their way. You&apos;ll get updates as your order ships.
      </motion.p>
      <motion.div variants={fadeInUp} className="mt-8 flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
        {orderNumber && (
          <Link href={`/track?order=${orderNumber}`} className="rounded-xl bg-slate-950 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-violet-700">
            Track your order →
          </Link>
        )}
        <Link href="/shop" className="rounded-xl border border-slate-300 px-6 py-3 text-sm font-bold text-slate-950 transition-colors hover:bg-slate-100">
          Continue shopping
        </Link>
      </motion.div>
    </motion.div>
  );
}

export default function SuccessPage() {
  return <Suspense fallback={<div className="mx-auto max-w-lg px-6 py-20 text-center text-slate-500">Loading confirmation…</div>}><SuccessContent /></Suspense>;
}
