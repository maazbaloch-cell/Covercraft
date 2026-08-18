"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { motion } from "framer-motion";
import { fadeInUp, staggerContainer } from "@/lib/motion";

function FailedContent() {
  const params = useSearchParams();
  const orderNumber = params.get("order");
  const reason = params.get("reason");

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="show" className="mx-auto flex max-w-lg flex-col items-center px-6 py-16 text-center sm:py-24">
      {/* Calm entrance — a gentle fade/scale, deliberately no bounce or celebration. */}
      <motion.span variants={fadeInUp} className="flex h-16 w-16 items-center justify-center rounded-full bg-rose-100 text-3xl text-rose-600">!</motion.span>
      <motion.h1 variants={fadeInUp} className="mt-6 text-3xl font-black tracking-tight text-slate-950">Payment failed</motion.h1>
      {orderNumber && (
        <motion.p variants={fadeInUp} className="mt-3 text-slate-600">
          Order: <b className="font-bold text-slate-950">{orderNumber}</b>
        </motion.p>
      )}
      {reason && <motion.p variants={fadeInUp} className="mt-2 text-slate-600">{reason}</motion.p>}
      <motion.p variants={fadeInUp} className="mt-2 leading-7 text-slate-500">
        No charge was made. You can try again or use a different payment method.
      </motion.p>
      <motion.div variants={fadeInUp} className="mt-8 flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
        <Link href="/cart" className="rounded-xl bg-slate-950 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-violet-700">
          Back to cart →
        </Link>
        <Link href="/complaint" className="rounded-xl border border-slate-300 px-6 py-3 text-sm font-bold text-slate-950 transition-colors hover:bg-slate-100">
          Contact support
        </Link>
      </motion.div>
    </motion.div>
  );
}

export default function FailedPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-lg px-6 py-20 text-center text-slate-500">Loading…</div>}>
      <FailedContent />
    </Suspense>
  );
}
