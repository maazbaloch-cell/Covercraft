"use client";

import { useCart } from "@/lib/cartStore";
import { useState, useRef } from "react";
import Link from "next/link";

export default function CartPage() {
  const { items, removeItem, updateQuantity, total } = useCart();
  const [customer, setCustomer] = useState({ name: "", email: "", phone: "", address: "", city: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const handleCheckout = () => {
    setError("");
    if (!customer.name || !customer.email || !customer.phone || !customer.address || !customer.city) {
      setError("Please fill in all your details before checkout.");
      return;
    }
    setSubmitting(true);
    // A real (non-AJAX) form submit is required here — EasyPaisa needs to fully
    // redirect the browser to their hosted payment page next.
    formRef.current?.submit();
  };

  if (items.length === 0) {
    return <div className="max-w-3xl mx-auto px-6 py-16 text-center text-gray-500">Your cart is empty.</div>;
  }

  const cartPayload = JSON.stringify(items.map(({ productId, quantity, productType, customDesign }) => ({ productId, quantity, productType, customDesign })));

  return (
    <div className="premium-cart max-w-3xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-bold mb-6">Your Cart</h1>

      <div className="space-y-4 mb-8">
        {items.map((i) => (
          <div key={i.productId} className="flex justify-between items-center bg-white p-4 rounded-lg border">
            <div>
              {i.productType === "customized_cover" && <img src={i.imageUrl} alt={`${i.title} preview`} className="w-16 h-20 object-cover rounded border mb-2" />}
              <p className="font-semibold">{i.title}</p>
              <p className="text-sm text-gray-500">Rs. {(i.price / 100).toFixed(0)} each</p>
              {i.customDesign && <p className="text-xs text-gray-500">{i.customDesign.mobileModel} · {i.customDesign.templateName}</p>}
            </div>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min={1}
                value={i.quantity}
                onChange={(e) => updateQuantity(i.productId, Math.max(1, parseInt(e.target.value) || 1))}
                className="w-16 border rounded px-2 py-1"
              />
              <button onClick={() => removeItem(i.productId)} className="text-red-500 text-sm">
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>

      {items.some((item) => item.productType === "customized_cover") && <Link href="/customize-cover" className="block text-sm text-brand-accent mb-6">Edit or create another custom cover</Link>}

      <p className="text-right font-bold text-lg mb-8">Total: Rs. {(total() / 100).toFixed(0)}</p>

      <h2 className="font-semibold mb-3">Shipping Details</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        <input className="border rounded px-3 py-2" placeholder="Full Name"
          value={customer.name} onChange={(e) => setCustomer({ ...customer, name: e.target.value })} />
        <input className="border rounded px-3 py-2" placeholder="Email"
          value={customer.email} onChange={(e) => setCustomer({ ...customer, email: e.target.value })} />
        <input className="border rounded px-3 py-2" placeholder="Phone (WhatsApp) e.g. 923001234567"
          value={customer.phone} onChange={(e) => setCustomer({ ...customer, phone: e.target.value })} />
        <input className="border rounded px-3 py-2" placeholder="City"
          value={customer.city} onChange={(e) => setCustomer({ ...customer, city: e.target.value })} />
        <input className="border rounded px-3 py-2 sm:col-span-2" placeholder="Full Address"
          value={customer.address} onChange={(e) => setCustomer({ ...customer, address: e.target.value })} />
      </div>

      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

      {/* Hidden real form — submitted directly (not via fetch) so EasyPaisa can redirect the browser */}
      <form ref={formRef} method="POST" action="/api/easypaisa/checkout" className="hidden">
        <input type="hidden" name="name" value={customer.name} readOnly />
        <input type="hidden" name="email" value={customer.email} readOnly />
        <input type="hidden" name="phone" value={customer.phone} readOnly />
        <input type="hidden" name="address" value={customer.address} readOnly />
        <input type="hidden" name="city" value={customer.city} readOnly />
        <input type="hidden" name="cart" value={cartPayload} readOnly />
      </form>

      <button
        onClick={handleCheckout}
        disabled={submitting}
        className="w-full bg-brand text-white py-3 rounded-lg font-semibold hover:bg-brand-accent transition disabled:opacity-50"
      >
        {submitting ? "Redirecting to EasyPaisa..." : "Pay with EasyPaisa"}
      </button>
    </div>
  );
}
