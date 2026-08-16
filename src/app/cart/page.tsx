"use client";

import { useCart } from "@/lib/cartStore";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { AnimatePresence, motion, animate, useMotionValue, useReducedMotion } from "framer-motion";
import Spinner from "@/components/Spinner";
import { DUR, EASE_OUT_EXPO } from "@/lib/motion";

/** Rupee total that counts up/down smoothly when the cart value changes. */
function AnimatedRupees({ cents }: { cents: number }) {
  const reduce = useReducedMotion();
  const mv = useMotionValue(cents);
  const [display, setDisplay] = useState(cents);
  useEffect(() => {
    if (reduce) { setDisplay(cents); return; }
    const controls = animate(mv, cents, { duration: 0.5, ease: EASE_OUT_EXPO, onUpdate: (v) => setDisplay(v) });
    return () => controls.stop();
  }, [cents, mv, reduce]);
  return <>Rs. {Math.round(display / 100).toLocaleString()}</>;
}

export default function CartPage() {
  const { items, removeItem, updateQuantity, total } = useCart();
  const [customer, setCustomer] = useState({ name: "", email: "", phone: "", address: "", city: "" });
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState<"details" | "otp">("details");
  const [code, setCode] = useState("");
  const [resendIn, setResendIn] = useState(0);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn(resendIn - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  const email = customer.email.trim();
  const emailOk = /.+@.+\..+/.test(email);
  const phoneOk = /^\+?[0-9\s()-]{7,20}$/.test(customer.phone.trim());

  const requestOtp = async () => {
    setError("");
    setInfo("");
    if (!customer.name || !email || !customer.phone || !customer.address || !customer.city) {
      setError("Please fill in all your details before checkout.");
      return;
    }
    if (!emailOk) return setError("Enter a valid email address.");
    if (!phoneOk) return setError("Enter a valid phone number (e.g. 923001234567).");
    setSubmitting(true);
    try {
      const res = await fetch("/api/checkout/otp/request", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Could not send the code. Please try again.");
        return;
      }
      setStep("otp");
      setCode("");
      setInfo(`We emailed a 6-digit code to ${email}. Enter it below to confirm your order.`);
      setResendIn(45);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const confirmAndPay = async () => {
    setError("");
    if (!/^\d{6}$/.test(code)) return setError("Enter the 6-digit code from your email.");
    setSubmitting(true);
    try {
      const res = await fetch("/api/checkout/otp/confirm", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, code }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "That code didn't work. Please try again.");
        setSubmitting(false);
        return;
      }
      // Ticket cookie is now set. A real (non-AJAX) form submit is required next —
      // EasyPaisa needs to fully redirect the browser to their hosted payment page.
      formRef.current?.submit();
    } catch {
      setError("Network error. Please try again.");
      setSubmitting(false);
    }
  };

  const editDetails = () => {
    setStep("details");
    setError("");
    setInfo("");
    setCode("");
  };

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-20">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: DUR.section, ease: EASE_OUT_EXPO }}
          className="flex flex-col items-center rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center"
        >
          <motion.span
            animate={{ y: [0, -9, 0] }}
            transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
            className="flex h-20 w-20 items-center justify-center rounded-2xl bg-violet-100 text-violet-700"
            aria-hidden
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-9 w-9" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" /></svg>
          </motion.span>
          <h1 className="mt-6 text-2xl font-black tracking-tight text-slate-950">Your cart is empty</h1>
          <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">Looks like you haven&apos;t added anything yet. Explore the collection and find a cover worth showing off.</p>
          <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} transition={{ duration: DUR.micro, ease: EASE_OUT_EXPO }} className="mt-7">
            <Link href="/shop" className="group inline-flex items-center rounded-full bg-slate-950 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-violet-700">
              Browse covers<span className="ml-2 transition-transform duration-200 group-hover:translate-x-1">→</span>
            </Link>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  const cartPayload = JSON.stringify(items.map(({ productId, quantity, productType, customDesign }) => ({ productId, quantity, productType, customDesign })));
  const detailsLocked = step === "otp";

  return (
    <div className="premium-cart max-w-3xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-bold mb-6">Your Cart</h1>

      <div className="mb-8">
        <AnimatePresence initial={false}>
          {items.map((i) => (
            <motion.div
              key={i.productId}
              layout
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0, transition: { duration: 0.28, ease: EASE_OUT_EXPO } }}
              transition={{ duration: DUR.base, ease: EASE_OUT_EXPO }}
              className="mb-3 overflow-hidden"
            >
              <div className="flex justify-between items-center bg-white p-4 rounded-lg border">
                <div>
                  {i.productType === "customized_cover" && (
                    // eslint-disable-next-line @next/next/no-img-element -- fabric.js toDataURL() produces a data: URL, which next/image cannot render
                    <img src={i.imageUrl} alt={`${i.title} preview`} loading="lazy" className="w-16 h-20 object-cover rounded border mb-2" />
                  )}
                  <p className="font-semibold">{i.title}</p>
                  <p className="text-sm text-gray-500">Rs. {(i.price / 100).toFixed(0)} each</p>
                  {i.customDesign && <p className="text-xs text-gray-500">{i.customDesign.mobileModel} · {i.customDesign.templateName}</p>}
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center rounded-lg border border-slate-200">
                    <button
                      type="button"
                      aria-label="Decrease quantity"
                      onClick={() => updateQuantity(i.productId, Math.max(1, i.quantity - 1))}
                      disabled={i.quantity <= 1}
                      className="px-2.5 py-1 text-lg font-bold text-slate-600 transition-colors hover:text-violet-700 active:scale-90 disabled:opacity-40"
                    >−</button>
                    <span className="inline-flex h-6 w-8 items-center justify-center overflow-hidden text-sm font-bold">
                      <AnimatePresence mode="popLayout" initial={false}>
                        <motion.span key={i.quantity} initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -10, opacity: 0 }} transition={{ duration: DUR.micro, ease: EASE_OUT_EXPO }} className="block">{i.quantity}</motion.span>
                      </AnimatePresence>
                    </span>
                    <button
                      type="button"
                      aria-label="Increase quantity"
                      onClick={() => updateQuantity(i.productId, i.quantity + 1)}
                      className="px-2.5 py-1 text-lg font-bold text-slate-600 transition-colors hover:text-violet-700 active:scale-90"
                    >+</button>
                  </div>
                  <motion.button whileTap={{ scale: 0.9 }} onClick={() => removeItem(i.productId)} className="text-sm text-red-500 transition-colors hover:text-red-600">
                    Remove
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {items.some((item) => item.productType === "customized_cover") && <Link href="/customize-cover" className="block text-sm text-brand-accent mb-6">Edit or create another custom cover</Link>}

      <p className="text-right font-bold text-lg mb-8">Total: <AnimatedRupees cents={total()} /></p>

      <h2 className="font-semibold mb-3">Shipping Details</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        <input className="border rounded px-3 py-2 disabled:bg-gray-100 disabled:text-gray-500" placeholder="Full Name" disabled={detailsLocked}
          value={customer.name} onChange={(e) => setCustomer({ ...customer, name: e.target.value })} />
        <input className="border rounded px-3 py-2 disabled:bg-gray-100 disabled:text-gray-500" placeholder="Email" disabled={detailsLocked}
          value={customer.email} onChange={(e) => setCustomer({ ...customer, email: e.target.value })} />
        <input className="border rounded px-3 py-2 disabled:bg-gray-100 disabled:text-gray-500" placeholder="Phone (WhatsApp) e.g. 923001234567" disabled={detailsLocked}
          value={customer.phone} onChange={(e) => setCustomer({ ...customer, phone: e.target.value })} />
        <input className="border rounded px-3 py-2 disabled:bg-gray-100 disabled:text-gray-500" placeholder="City" disabled={detailsLocked}
          value={customer.city} onChange={(e) => setCustomer({ ...customer, city: e.target.value })} />
        <input className="border rounded px-3 py-2 sm:col-span-2 disabled:bg-gray-100 disabled:text-gray-500" placeholder="Full Address" disabled={detailsLocked}
          value={customer.address} onChange={(e) => setCustomer({ ...customer, address: e.target.value })} />
      </div>

      <AnimatePresence initial={false}>
        {info && (
          <motion.p key="info" initial={{ opacity: 0, height: 0, y: -4 }} animate={{ opacity: 1, height: "auto", y: 0 }} exit={{ opacity: 0, height: 0 }} transition={{ duration: DUR.base, ease: EASE_OUT_EXPO }} className="overflow-hidden text-green-600 text-sm mb-3">{info}</motion.p>
        )}
        {error && (
          <motion.p key="error" initial={{ opacity: 0, height: 0, y: -4 }} animate={{ opacity: 1, height: "auto", y: 0 }} exit={{ opacity: 0, height: 0 }} transition={{ duration: DUR.base, ease: EASE_OUT_EXPO }} role="alert" className="overflow-hidden text-red-500 text-sm mb-4">{error}</motion.p>
        )}
      </AnimatePresence>

      {/* Hidden real form — submitted directly (not via fetch) so EasyPaisa can redirect the browser */}
      <form ref={formRef} method="POST" action="/api/easypaisa/checkout" className="hidden">
        <input type="hidden" name="name" value={customer.name} readOnly />
        <input type="hidden" name="email" value={customer.email} readOnly />
        <input type="hidden" name="phone" value={customer.phone} readOnly />
        <input type="hidden" name="address" value={customer.address} readOnly />
        <input type="hidden" name="city" value={customer.city} readOnly />
        <input type="hidden" name="cart" value={cartPayload} readOnly />
      </form>

      <AnimatePresence mode="wait" initial={false}>
        {step === "details" ? (
          <motion.button
            key="details"
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: DUR.base, ease: EASE_OUT_EXPO }}
            whileTap={{ scale: 0.99 }}
            onClick={requestOtp}
            disabled={submitting}
            className="relative w-full bg-brand text-white py-3 rounded-lg font-semibold transition-colors hover:bg-brand-accent disabled:opacity-70"
          >
            <span className={submitting ? "opacity-0" : ""}>Continue to secure checkout</span>
            {submitting && <span className="absolute inset-0 flex items-center justify-center"><Spinner /></span>}
          </motion.button>
        ) : (
          <motion.div
            key="otp"
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 24 }}
            transition={{ duration: DUR.base, ease: EASE_OUT_EXPO }}
            className="space-y-3"
          >
            <div>
              <label className="block text-sm font-medium mb-1">Enter the 6-digit code</label>
              <input
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="123456"
                className="w-full border rounded px-3 py-2 tracking-[0.5em] text-center text-lg"
              />
            </div>
            <motion.button
              whileTap={{ scale: 0.99 }}
              onClick={confirmAndPay}
              disabled={submitting}
              className="relative w-full bg-brand text-white py-3 rounded-lg font-semibold transition-colors hover:bg-brand-accent disabled:opacity-70"
            >
              <span className={submitting ? "opacity-0" : ""}>Confirm &amp; Pay with EasyPaisa</span>
              {submitting && <span className="absolute inset-0 flex items-center justify-center"><Spinner /></span>}
            </motion.button>
            <div className="flex items-center justify-between text-sm">
              <button onClick={editDetails} className="text-gray-500 transition-colors hover:text-gray-700" disabled={submitting}>Edit details</button>
              <button onClick={requestOtp} className="text-brand-accent transition-colors disabled:opacity-50" disabled={submitting || resendIn > 0}>
                {resendIn > 0 ? `Resend code in ${resendIn}s` : "Resend code"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
