"use client";

import { useCart } from "@/lib/cartStore";
import { useState, useRef, useEffect, type ReactNode } from "react";
import Link from "next/link";
import { AnimatePresence, motion, animate, useMotionValue, useReducedMotion } from "framer-motion";
import Spinner from "@/components/Spinner";
import { DUR, EASE_OUT_EXPO } from "@/lib/motion";

/* ------------------------------------------------------------------ *
 * Icons — inline strokes so the premium checkout needs no icon dep.
 * ------------------------------------------------------------------ */
type IconProps = { className?: string };
function Svg({ children, className = "h-4 w-4" }: { children: ReactNode; className?: string }) {
  return <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden>{children}</svg>;
}
const IconBack = ({ className }: IconProps) => <Svg className={className}><path d="M15 18l-6-6 6-6" /></Svg>;
const IconLock = ({ className }: IconProps) => <Svg className={className}><rect x="4" y="11" width="16" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></Svg>;
const IconShield = ({ className }: IconProps) => <Svg className={className}><path d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z" /><path d="M9.5 12l1.8 1.8L15 10" /></Svg>;
const IconTruck = ({ className }: IconProps) => <Svg className={className}><path d="M3 7h11v9H3zM14 10h4l3 3v3h-7" /><circle cx="7" cy="18" r="1.6" /><circle cx="17.5" cy="18" r="1.6" /></Svg>;
const IconGem = ({ className }: IconProps) => <Svg className={className}><path d="M6 3h12l3 6-9 12L3 9z M3 9h18 M9 3l-3 6 6 12 6-12-3-6" /></Svg>;
const IconReturn = ({ className }: IconProps) => <Svg className={className}><path d="M4 8h10a5 5 0 0 1 0 10H8" /><path d="M7 5L4 8l3 3" /></Svg>;
const IconTag = ({ className }: IconProps) => <Svg className={className}><path d="M3 12V4h8l9 9-8 8z" /><circle cx="7.5" cy="7.5" r="1.3" /></Svg>;
const IconUser = ({ className }: IconProps) => <Svg className={className}><circle cx="12" cy="8" r="4" /><path d="M4 20c0-3.5 3.6-6 8-6s8 2.5 8 6" /></Svg>;
const IconMail = ({ className }: IconProps) => <Svg className={className}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M4 7l8 6 8-6" /></Svg>;
const IconPhone = ({ className }: IconProps) => <Svg className={className}><path d="M4 4h4l2 5-2.5 1.5a12 12 0 0 0 6 6L15 14l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 2 6a2 2 0 0 1 2-2z" /></Svg>;
const IconPin = ({ className }: IconProps) => <Svg className={className}><path d="M12 21c5-4.5 7-7.9 7-11a7 7 0 1 0-14 0c0 3.1 2 6.5 7 11z" /><circle cx="12" cy="10" r="2.5" /></Svg>;
const IconNote = ({ className }: IconProps) => <Svg className={className}><path d="M4 4h11l5 5v11H4z" /><path d="M15 4v5h5M8 13h8M8 17h5" /></Svg>;
const IconChevron = ({ className }: IconProps) => <Svg className={className}><path d="M6 9l6 6 6-6" /></Svg>;
const IconChat = ({ className }: IconProps) => <Svg className={className}><path d="M4 5h16v11H9l-4 3v-3H4z" /></Svg>;

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

/** A labelled, icon-led form field wrapper (premium focus handled in CSS). */
function Field({ id, label, icon, children, full }: { id: string; label: string; icon: ReactNode; children: ReactNode; full?: boolean }) {
  return (
    <div className={`co-field ${full ? "sm:col-span-2" : ""}`}>
      <label htmlFor={id} className="co-label">{icon}<span>{label}</span></label>
      {children}
    </div>
  );
}

const TRUST = [
  { icon: <IconShield className="h-5 w-5" />, title: "Secure Checkout", note: "100% Protected" },
  { icon: <IconTruck className="h-5 w-5" />, title: "Fast Delivery", note: "2–4 Business Days" },
  { icon: <IconGem className="h-5 w-5" />, title: "Premium Quality", note: "Top-Grade Materials" },
  { icon: <IconReturn className="h-5 w-5" />, title: "Easy Returns", note: "7-Day Return Window" },
];

export default function CartPage() {
  const { items, removeItem, updateQuantity, total } = useCart();
  const [customer, setCustomer] = useState({ name: "", email: "", phone: "", address: "", city: "" });
  const [instructions, setInstructions] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState<"details" | "otp">("details");
  const [code, setCode] = useState("");
  const [resendIn, setResendIn] = useState(0);
  const [couponOpen, setCouponOpen] = useState(false);
  const [coupon, setCoupon] = useState("");
  const [couponMsg, setCouponMsg] = useState("");
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

  const applyCoupon = () => {
    if (!coupon.trim()) { setCouponMsg(""); return; }
    // No promo-code backend exists yet — respond honestly rather than faking a discount.
    setCouponMsg("No active promo codes right now — you're already seeing our best price.");
  };

  if (items.length === 0) {
    return (
      <div className="util-dark checkout mx-auto max-w-3xl px-6 py-24">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: DUR.section, ease: EASE_OUT_EXPO }}
          className="co-panel flex flex-col items-center px-6 py-16 text-center"
        >
          <motion.span
            animate={{ y: [0, -9, 0] }}
            transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
            className="flex h-20 w-20 items-center justify-center rounded-2xl bg-blue-100 text-accent-700"
            aria-hidden
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-9 w-9" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" /></svg>
          </motion.span>
          <h1 className="mt-6 text-2xl font-black tracking-tight">Your cart is empty</h1>
          <p className="mt-2 max-w-sm text-sm leading-6 text-slate-400">Looks like you haven&apos;t added anything yet. Explore the collection and find a cover worth showing off.</p>
          <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} transition={{ duration: DUR.micro, ease: EASE_OUT_EXPO }} className="mt-7">
            <Link href="/shop" className="group inline-flex items-center rounded-full bg-brand px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-brand-accent">
              Browse covers<span className="ml-2 transition-transform duration-200 group-hover:translate-x-1">→</span>
            </Link>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  const cartPayload = JSON.stringify(items.map(({ productId, quantity, productType, customDesign }) => ({ productId, quantity, productType, customDesign })));
  const detailsLocked = step === "otp";
  const note = instructions.trim();
  // Additional instructions are delivered for real — appended to the address the
  // backend already stores/emails (address is a 500-char text field). Capped so
  // the combined string never exceeds the column limit.
  const shippingAddress = (note ? `${customer.address}\n\nDelivery note: ${note}` : customer.address).slice(0, 500);

  return (
    <div className="util-dark checkout pb-4">
      <div className="mx-auto w-full max-w-[var(--cinema-max)] px-5 pt-6 sm:px-8">
        {/* Secure-checkout bar — complements the global site header */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: DUR.base, ease: EASE_OUT_EXPO }}
          className="co-securebar"
        >
          <Link href="/shop" className="co-back"><IconBack className="h-4 w-4" /><span>Back to Shop</span></Link>
          <span className="co-secure"><IconLock className="h-4 w-4 text-accent-300" /><span><b>Secure Checkout</b><em>Your data is protected</em></span></span>
        </motion.div>

        {/* Hero */}
        <motion.header
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: DUR.section, ease: EASE_OUT_EXPO }}
          className="co-hero"
        >
          <p className="co-eyebrow">Checkout</p>
          <h1 className="co-title">Your <span className="co-grad">Order</span></h1>
          <p className="co-sub">Review your items and complete your order.</p>
        </motion.header>

        {/* Two-column checkout */}
        <div className="grid items-start gap-6 lg:grid-cols-[1.05fr_0.92fr] xl:gap-8">
          {/* LEFT — Order summary */}
          <motion.section
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: DUR.section, ease: EASE_OUT_EXPO, delay: 0.05 }}
            className="co-panel"
          >
            <div className="co-panel-head">
              <h2 className="co-panel-title">Your Items <span className="co-count">({items.length})</span></h2>
              <span className="co-panel-kicker">Order Summary</span>
            </div>

            <ul className="co-items">
              <AnimatePresence initial={false}>
                {items.map((i) => (
                  <motion.li
                    key={i.productId}
                    layout
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, height: 0, marginTop: 0, marginBottom: 0, transition: { duration: 0.28, ease: EASE_OUT_EXPO } }}
                    transition={{ duration: DUR.base, ease: EASE_OUT_EXPO }}
                    className="co-item"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element -- custom covers use fabric.js toDataURL() data: URLs, which next/image cannot render */}
                    <img src={i.imageUrl} alt={`${i.title} preview`} loading="lazy" className="co-thumb" />
                    <div className="co-item-body">
                      <p className="co-item-title">{i.title}</p>
                      <p className="co-item-type">{i.productType === "customized_cover" ? "Premium Custom Cover" : "Premium Mobile Cover"}</p>
                      {i.customDesign && (
                        <p className="co-item-meta">{i.customDesign.mobileModel} · {i.customDesign.templateName}</p>
                      )}
                      {i.productType === "customized_cover" && <span className="co-badge">Customized</span>}
                    </div>
                    <div className="co-item-side">
                      <p className="co-item-price">Rs. {(i.price / 100).toFixed(0)}<em>each</em></p>
                      <div className="co-qty">
                        <button
                          type="button"
                          aria-label="Decrease quantity"
                          onClick={() => updateQuantity(i.productId, Math.max(1, i.quantity - 1))}
                          disabled={i.quantity <= 1}
                        >−</button>
                        <span className="co-qty-num">
                          <AnimatePresence mode="popLayout" initial={false}>
                            <motion.span key={i.quantity} initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -10, opacity: 0 }} transition={{ duration: DUR.micro, ease: EASE_OUT_EXPO }} className="block">{i.quantity}</motion.span>
                          </AnimatePresence>
                        </span>
                        <button
                          type="button"
                          aria-label="Increase quantity"
                          onClick={() => updateQuantity(i.productId, i.quantity + 1)}
                        >+</button>
                      </div>
                      <motion.button whileTap={{ scale: 0.9 }} onClick={() => removeItem(i.productId)} className="co-remove">Remove</motion.button>
                    </div>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>

            {items.some((item) => item.productType === "customized_cover") && (
              <Link href="/customize-cover" className="co-editlink">+ Edit or create another custom cover</Link>
            )}

            {/* Coupon */}
            <div className="co-coupon">
              <button type="button" className="co-coupon-toggle" onClick={() => setCouponOpen((o) => !o)} aria-expanded={couponOpen}>
                <IconTag className="h-4 w-4 text-accent-300" />
                <span>Have a coupon code?</span>
                <IconChevron className={`h-4 w-4 co-coupon-chev ${couponOpen ? "is-open" : ""}`} />
              </button>
              <AnimatePresence initial={false}>
                {couponOpen && (
                  <motion.div
                    key="coupon-body"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: DUR.base, ease: EASE_OUT_EXPO }}
                    className="overflow-hidden"
                  >
                    <div className="co-coupon-row">
                      <input value={coupon} onChange={(e) => { setCoupon(e.target.value); setCouponMsg(""); }} placeholder="Enter code" aria-label="Coupon code" />
                      <button type="button" onClick={applyCoupon} className="co-coupon-apply">Apply code →</button>
                    </div>
                    {couponMsg && <p className="co-coupon-msg">{couponMsg}</p>}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Price summary */}
            <dl className="co-summary">
              <div className="co-summary-row"><dt>Subtotal</dt><dd><AnimatedRupees cents={total()} /></dd></div>
              <div className="co-summary-row"><dt>Shipping</dt><dd className="co-free">Free</dd></div>
              <div className="co-summary-total"><dt>Total</dt><dd><AnimatedRupees cents={total()} /></dd></div>
            </dl>
          </motion.section>

          {/* RIGHT — Shipping details */}
          <motion.section
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: DUR.section, ease: EASE_OUT_EXPO, delay: 0.12 }}
            className="co-panel"
          >
            <div className="co-panel-head">
              <span className="co-head-icon"><IconPin className="h-5 w-5" /></span>
              <div>
                <h2 className="co-panel-title">Shipping Details</h2>
                <p className="co-panel-kicker">Enter your details to continue.</p>
              </div>
            </div>

            <div className="co-fields">
              <Field id="co-name" label="Full Name" icon={<IconUser className="h-4 w-4" />} full>
                <input id="co-name" placeholder="e.g. Ayesha Khan" disabled={detailsLocked}
                  value={customer.name} onChange={(e) => setCustomer({ ...customer, name: e.target.value })} />
              </Field>
              <Field id="co-email" label="Email Address" icon={<IconMail className="h-4 w-4" />}>
                <input id="co-email" type="email" inputMode="email" placeholder="you@email.com" disabled={detailsLocked}
                  value={customer.email} onChange={(e) => setCustomer({ ...customer, email: e.target.value })} />
              </Field>
              <Field id="co-phone" label="Phone / WhatsApp" icon={<IconPhone className="h-4 w-4" />}>
                <input id="co-phone" inputMode="tel" placeholder="923001234567" disabled={detailsLocked}
                  value={customer.phone} onChange={(e) => setCustomer({ ...customer, phone: e.target.value })} />
              </Field>
              <Field id="co-city" label="City" icon={<IconPin className="h-4 w-4" />}>
                <input id="co-city" placeholder="e.g. Karachi" disabled={detailsLocked}
                  value={customer.city} onChange={(e) => setCustomer({ ...customer, city: e.target.value })} />
              </Field>
              <Field id="co-address" label="Full Address" icon={<IconPin className="h-4 w-4" />} full>
                <textarea id="co-address" rows={2} placeholder="House / street, area, landmark" disabled={detailsLocked}
                  value={customer.address} onChange={(e) => setCustomer({ ...customer, address: e.target.value })} />
              </Field>
              <Field id="co-note" label="Additional Instructions (optional)" icon={<IconNote className="h-4 w-4" />} full>
                <textarea id="co-note" rows={2} maxLength={220} placeholder="Delivery notes, preferred timing…" disabled={detailsLocked}
                  value={instructions} onChange={(e) => setInstructions(e.target.value)} />
              </Field>
            </div>

            {/* Order updates */}
            <div className="co-updates">
              <IconChat className="h-4 w-4 text-accent-300" />
              <div>
                <p className="co-updates-title">Order Updates</p>
                <p className="co-updates-note">We&apos;ll email your confirmation and use WhatsApp for delivery updates.</p>
              </div>
            </div>

            <AnimatePresence initial={false}>
              {info && (
                <motion.p key="info" initial={{ opacity: 0, height: 0, y: -4 }} animate={{ opacity: 1, height: "auto", y: 0 }} exit={{ opacity: 0, height: 0 }} transition={{ duration: DUR.base, ease: EASE_OUT_EXPO }} className="co-msg co-msg-ok">{info}</motion.p>
              )}
              {error && (
                <motion.p key="error" initial={{ opacity: 0, height: 0, y: -4 }} animate={{ opacity: 1, height: "auto", y: 0 }} exit={{ opacity: 0, height: 0 }} transition={{ duration: DUR.base, ease: EASE_OUT_EXPO }} role="alert" className="co-msg co-msg-err">{error}</motion.p>
              )}
            </AnimatePresence>

            {/* Hidden real form — submitted directly (not via fetch) so EasyPaisa can redirect the browser */}
            <form ref={formRef} method="POST" action="/api/easypaisa/checkout" className="hidden">
              <input type="hidden" name="name" value={customer.name} readOnly />
              <input type="hidden" name="email" value={customer.email} readOnly />
              <input type="hidden" name="phone" value={customer.phone} readOnly />
              <input type="hidden" name="address" value={shippingAddress} readOnly />
              <input type="hidden" name="city" value={customer.city} readOnly />
              <input type="hidden" name="cart" value={cartPayload} readOnly />
            </form>

            <AnimatePresence mode="wait" initial={false}>
              {step === "details" ? (
                <motion.button
                  key="details"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: DUR.base, ease: EASE_OUT_EXPO }}
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={requestOtp}
                  disabled={submitting}
                  className="co-cta"
                >
                  <span className={submitting ? "opacity-0" : "co-cta-label"}><IconLock className="h-4 w-4" />Continue to secure checkout<span className="co-cta-arrow">→</span></span>
                  {submitting && <span className="absolute inset-0 flex items-center justify-center"><Spinner /></span>}
                </motion.button>
              ) : (
                <motion.div
                  key="otp"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: DUR.base, ease: EASE_OUT_EXPO }}
                  className="space-y-3"
                >
                  <div className="co-field">
                    <label htmlFor="co-otp" className="co-label"><IconLock className="h-4 w-4" /><span>Enter the 6-digit code</span></label>
                    <input
                      id="co-otp"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength={6}
                      value={code}
                      onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      placeholder="123456"
                      className="co-otp"
                    />
                  </div>
                  <motion.button
                    whileHover={{ y: -1 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={confirmAndPay}
                    disabled={submitting}
                    className="co-cta"
                  >
                    <span className={submitting ? "opacity-0" : "co-cta-label"}><IconLock className="h-4 w-4" />Confirm &amp; Pay with EasyPaisa</span>
                    {submitting && <span className="absolute inset-0 flex items-center justify-center"><Spinner /></span>}
                  </motion.button>
                  <div className="flex items-center justify-between text-sm">
                    <button onClick={editDetails} className="co-textbtn" disabled={submitting}>Edit details</button>
                    <button onClick={requestOtp} className="co-textbtn co-textbtn-accent" disabled={submitting || resendIn > 0}>
                      {resendIn > 0 ? `Resend code in ${resendIn}s` : "Resend code"}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.section>
        </div>

        {/* Trust strip */}
        <motion.ul
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "0px 0px -40px 0px" }}
          transition={{ duration: DUR.section, ease: EASE_OUT_EXPO }}
          className="co-trust"
        >
          {TRUST.map((t) => (
            <li key={t.title} className="co-trust-item">
              <span className="co-trust-icon">{t.icon}</span>
              <div><p className="co-trust-title">{t.title}</p><p className="co-trust-note">{t.note}</p></div>
            </li>
          ))}
        </motion.ul>

        {/* Payment / security — only methods the backend actually supports */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "0px 0px -40px 0px" }}
          transition={{ duration: DUR.section, ease: EASE_OUT_EXPO }}
          className="co-pay"
        >
          <div className="co-pay-left">
            <p className="co-pay-label">We Accept</p>
            <span className="co-pay-method"><span className="co-pay-dot" />EasyPaisa</span>
          </div>
          <p className="co-pay-secure"><IconLock className="h-4 w-4 text-accent-300" />Secure encrypted checkout · you&apos;ll be redirected to EasyPaisa to pay.</p>
        </motion.section>
      </div>
    </div>
  );
}
