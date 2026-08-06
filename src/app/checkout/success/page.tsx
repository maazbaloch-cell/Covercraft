"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense, useEffect } from "react";
import { useCart } from "@/lib/cartStore";

function SuccessContent() {
  const params = useSearchParams();
  const orderNumber = params.get("order");
  const clear = useCart((s) => s.clear);

  useEffect(() => {
    clear();
  }, [clear]);

  return (
    <div className="max-w-lg mx-auto px-6 py-20 text-center">
      <h1 className="text-2xl font-bold mb-3">🎉 Payment Successful!</h1>
      <p className="text-gray-600 mb-2">Your order <b>{orderNumber}</b> has been confirmed.</p>
      <p className="text-gray-600 mb-8">
        A confirmation email and WhatsApp message have been sent. You&apos;ll get updates as your order ships.
      </p>
      <Link href={`/track?order=${orderNumber}`} className="text-brand-accent font-semibold">
        Track your order →
      </Link>
    </div>
  );
}

export default function SuccessPage() {
  return <Suspense fallback={<div className="max-w-lg mx-auto px-6 py-20 text-center">Loading confirmation...</div>}><SuccessContent /></Suspense>;
}
