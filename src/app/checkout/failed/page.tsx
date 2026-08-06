"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";

function FailedContent() {
  const params = useSearchParams();
  const orderNumber = params.get("order");
  const reason = params.get("reason");

  return (
    <div className="max-w-lg mx-auto px-6 py-20 text-center">
      <h1 className="text-2xl font-bold mb-3">Payment Failed</h1>
      {orderNumber && <p className="text-gray-600 mb-2">Order: <b>{orderNumber}</b></p>}
      {reason && <p className="text-gray-600 mb-6">{reason}</p>}
      <p className="text-gray-600 mb-8">
        No charge was made. You can try again or use a different payment method.
      </p>
      <Link href="/cart" className="text-brand-accent font-semibold">
        Back to cart →
      </Link>
    </div>
  );
}

export default function FailedPage() {
  return (
    <Suspense fallback={<div className="px-6 py-10">Loading...</div>}>
      <FailedContent />
    </Suspense>
  );
}
