"use client";

import { type FormEvent, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { DUR, EASE_OUT_EXPO, fadeInUp, staggerContainer, viewportOnce } from "@/lib/motion";

/* ---------------------------------------------------------------- Types */

type Faq = { id: string; question: string; answer: string; category: string; slug: string };
type FormStatus = "idle" | "submitting" | "success" | "error";

const CATEGORY_LABEL: Record<string, string> = {
  ORDERING: "Ordering",
  SHIPPING: "Shipping & Delivery",
  TRACKING: "Tracking",
  CUSTOMIZATION: "Customization",
  PAYMENTS: "Payments",
  RETURNS: "Returns & Refunds",
  OTHER: "General",
};

const TOPICS: { key: string; label: string; blurb: string; icon: JSX.Element }[] = [
  { key: "ORDERING", label: "Ordering", blurb: "Placing & managing orders", icon: <IconBag /> },
  { key: "SHIPPING", label: "Shipping & Delivery", blurb: "Timelines, costs & areas", icon: <IconTruck /> },
  { key: "TRACKING", label: "Tracking", blurb: "Where your order is", icon: <IconPin /> },
  { key: "CUSTOMIZATION", label: "Customization", blurb: "Designing your cover", icon: <IconBrush /> },
  { key: "PAYMENTS", label: "Payments", blurb: "Methods & security", icon: <IconCard /> },
  { key: "RETURNS", label: "Returns & Refunds", blurb: "Policies & damaged items", icon: <IconReturn /> },
];

const QUICK_HELP: { title: string; desc: string; href: string; icon: JSX.Element }[] = [
  { title: "Track your order", desc: "See live status and courier updates", href: "/track", icon: <IconPin /> },
  { title: "Customize your cover", desc: "Design a cover for your exact phone", href: "/customize-cover", icon: <IconBrush /> },
  { title: "Orders & payment", desc: "Your order history and receipts", href: "/account", icon: <IconCard /> },
  { title: "Contact support", desc: "Send us a request — we'll reply fast", href: "#contact", icon: <IconChat /> },
];

const CONTACT_CATEGORIES = ["ORDERING", "SHIPPING", "TRACKING", "CUSTOMIZATION", "PAYMENTS", "RETURNS", "OTHER"];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/* ---------------------------------------------------------------- Page */

export default function SupportPage() {
  const reduce = useReducedMotion();

  // Search + FAQ state
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [category, setCategory] = useState<string>("");
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [faqState, setFaqState] = useState<"loading" | "ready" | "error">("loading");
  const [openId, setOpenId] = useState<string | null>(null);
  const faqRef = useRef<HTMLDivElement | null>(null);
  const contactRef = useRef<HTMLDivElement | null>(null);

  // Debounce the free-text query (server-side search).
  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 300);
    return () => clearTimeout(t);
  }, [query]);

  // Fetch FAQs whenever the debounced query or category changes.
  useEffect(() => {
    let active = true;
    setFaqState("loading");
    const params = new URLSearchParams();
    if (debounced) params.set("q", debounced);
    if (category) params.set("category", category);
    fetch(`/api/support/faqs?${params.toString()}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((body) => {
        if (!active) return;
        setFaqs(body.faqs || []);
        setFaqState("ready");
      })
      .catch(() => active && setFaqState("error"));
    return () => {
      active = false;
    };
  }, [debounced, category]);

  const scrollTo = useCallback((el: HTMLElement | null) => {
    el?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  }, [reduce]);

  const onSearchSubmit = (e: FormEvent) => {
    e.preventDefault();
    scrollTo(faqRef.current);
  };

  const pickTopic = (key: string) => {
    setCategory((c) => (c === key ? "" : key));
    setOpenId(null);
    scrollTo(faqRef.current);
  };

  return (
    <div className="support-page min-h-screen bg-ink-950 text-white">
      {/* ============================================= HERO */}
      <section className="support-hero relative overflow-hidden">
        <div className="support-hero-glow" aria-hidden />
        <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[1.1fr_.9fr] lg:py-28">
          <motion.div
            initial={reduce ? false : "hidden"}
            animate="show"
            variants={staggerContainer}
          >
            <motion.p variants={fadeInUp} className="text-xs font-bold uppercase tracking-[0.28em] text-accent-400">
              Support Center
            </motion.p>
            <motion.h1 variants={fadeInUp} className="mt-4 text-4xl font-black leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
              How can we help you?
            </motion.h1>
            <motion.p variants={fadeInUp} className="mt-5 max-w-xl text-base text-slate-300 sm:text-lg">
              Search our help topics, track an order, or send us a message. Real answers from the team that makes your covers — no bots, no runaround.
            </motion.p>

            <motion.form variants={fadeInUp} onSubmit={onSearchSubmit} className="support-search mt-8" role="search">
              <label htmlFor="support-search" className="sr-only">Search for help</label>
              <span className="support-search-icon" aria-hidden><IconSearch /></span>
              <input
                id="support-search"
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search for help…"
                autoComplete="off"
                className="support-search-input"
              />
              {query && (
                <button type="button" onClick={() => setQuery("")} aria-label="Clear search" className="support-search-clear">×</button>
              )}
            </motion.form>
            <motion.p variants={fadeInUp} className="mt-3 text-xs text-slate-400">
              Try “track my order”, “custom cover”, or “refund”.
            </motion.p>
          </motion.div>

          {/* Support visual — composed, masked into the dark environment (no boxy card). */}
          <motion.div
            className="support-visual"
            aria-hidden
            initial={reduce ? false : { opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: DUR.slow, ease: EASE_OUT_EXPO }}
          >
            <div className="support-visual-orb" />
            <div className="support-visual-ring" />
            <div className="support-visual-glyph">
              <IconHeadset />
            </div>
            <div className="support-visual-chip support-visual-chip--1"><span className="support-dot" /> Avg. reply under 24h</div>
            <div className="support-visual-chip support-visual-chip--2"><span className="support-dot support-dot--blue" /> Real humans</div>
          </motion.div>
        </div>
      </section>

      {/* ============================================= QUICK HELP */}
      <section className="mx-auto max-w-7xl px-4 pb-6 sm:px-6">
        <motion.div
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
          initial={reduce ? false : "hidden"}
          whileInView="show"
          viewport={viewportOnce}
          variants={staggerContainer}
        >
          {QUICK_HELP.map((q) => {
            const inner = (
              <>
                <span className="support-qh-icon">{q.icon}</span>
                <span className="mt-4 block text-base font-bold text-white">{q.title}</span>
                <span className="mt-1 block text-sm text-slate-400">{q.desc}</span>
                <span className="support-qh-arrow" aria-hidden><IconArrow /></span>
              </>
            );
            return (
              <motion.div key={q.title} variants={fadeInUp}>
                {q.href.startsWith("#") ? (
                  <button
                    type="button"
                    onClick={() => scrollTo(contactRef.current)}
                    className="support-qh group text-left"
                  >
                    {inner}
                  </button>
                ) : (
                  <Link href={q.href} className="support-qh group">{inner}</Link>
                )}
              </motion.div>
            );
          })}
        </motion.div>
      </section>

      {/* ============================================= BROWSE TOPICS */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <motion.div initial={reduce ? false : "hidden"} whileInView="show" viewport={viewportOnce} variants={fadeInUp}>
          <h2 className="text-2xl font-black tracking-tight sm:text-3xl">Browse help topics</h2>
          <p className="mt-2 text-sm text-slate-400">Pick a topic to filter the questions below.</p>
        </motion.div>
        <motion.div
          className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          initial={reduce ? false : "hidden"}
          whileInView="show"
          viewport={viewportOnce}
          variants={staggerContainer}
        >
          {TOPICS.map((t) => (
            <motion.button
              key={t.key}
              type="button"
              variants={fadeInUp}
              onClick={() => pickTopic(t.key)}
              aria-pressed={category === t.key}
              className={`support-topic group ${category === t.key ? "is-active" : ""}`}
            >
              <span className="support-topic-icon">{t.icon}</span>
              <span className="flex-1">
                <span className="block text-base font-bold text-white">{t.label}</span>
                <span className="mt-0.5 block text-sm text-slate-400">{t.blurb}</span>
              </span>
              <span className="support-topic-arrow" aria-hidden><IconArrow /></span>
            </motion.button>
          ))}
        </motion.div>
      </section>

      {/* ============================================= FAQ */}
      <section ref={faqRef} className="scroll-mt-24 border-t border-white/5 bg-ink-950 py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <motion.div initial={reduce ? false : "hidden"} whileInView="show" viewport={viewportOnce} variants={fadeInUp} className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-2xl font-black tracking-tight sm:text-3xl">Frequently asked questions</h2>
              <p className="mt-2 text-sm text-slate-400">
                {category ? `Showing: ${CATEGORY_LABEL[category]}` : "The questions customers ask us most."}
              </p>
            </div>
            {(category || debounced) && (
              <button
                type="button"
                onClick={() => { setCategory(""); setQuery(""); }}
                className="rounded-full border border-white/15 px-4 py-1.5 text-xs font-semibold text-slate-200 transition-colors hover:bg-white/10"
              >
                Clear filters
              </button>
            )}
          </motion.div>

          <div className="mt-8 space-y-3" aria-live="polite">
            {faqState === "loading" && (
              <div className="space-y-3">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="h-16 animate-pulse rounded-2xl border border-white/5 bg-white/[0.03]" />
                ))}
              </div>
            )}

            {faqState === "error" && (
              <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-center text-sm text-red-200">
                We couldn't load help topics right now. Please refresh the page or try again shortly.
              </div>
            )}

            {faqState === "ready" && faqs.length === 0 && (
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center">
                <p className="text-base font-semibold text-white">No results found</p>
                <p className="mt-1 text-sm text-slate-400">
                  {debounced ? `Nothing matched “${debounced}”.` : "No questions in this topic yet."} Try a different search, or contact support below.
                </p>
                <button type="button" onClick={() => scrollTo(contactRef.current)} className="mt-4 inline-flex rounded-full bg-accent-600 px-5 py-2 text-sm font-bold text-white shadow-glow transition-colors hover:bg-accent-500">
                  Contact support
                </button>
              </div>
            )}

            {faqState === "ready" && faqs.map((f) => {
              const open = openId === f.id;
              return (
                <div key={f.id} className={`support-faq ${open ? "is-open" : ""}`}>
                  <h3>
                    <button
                      type="button"
                      onClick={() => setOpenId(open ? null : f.id)}
                      aria-expanded={open}
                      aria-controls={`faq-panel-${f.id}`}
                      id={`faq-button-${f.id}`}
                      className="support-faq-q"
                    >
                      <span className="flex-1 text-left">{f.question}</span>
                      <span className="support-faq-chevron" aria-hidden><IconChevron /></span>
                    </button>
                  </h3>
                  <AnimatePresence initial={false}>
                    {open && (
                      <motion.div
                        key="panel"
                        id={`faq-panel-${f.id}`}
                        role="region"
                        aria-labelledby={`faq-button-${f.id}`}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: DUR.base, ease: EASE_OUT_EXPO }}
                        className="overflow-hidden"
                      >
                        <p className="support-faq-a">{f.answer}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============================================= CONTACT */}
      <section ref={contactRef} id="contact" className="scroll-mt-24 border-t border-white/5 py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <ContactForm reduce={!!reduce} />
        </div>
      </section>
    </div>
  );
}

/* ---------------------------------------------------------------- Contact form */

function ContactForm({ reduce }: { reduce: boolean }) {
  const [form, setForm] = useState({ name: "", email: "", orderNumber: "", category: "OTHER", subject: "", message: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<FormStatus>("idle");
  const [serverError, setServerError] = useState("");
  const [ticketNumber, setTicketNumber] = useState("");

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Please enter your name.";
    if (!EMAIL_RE.test(form.email.trim())) e.email = "Please enter a valid email address.";
    if (form.subject.trim().length < 3) e.subject = "Please add a short subject.";
    if (form.message.trim().length < 10) e.message = "Please describe your issue (at least 10 characters).";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (ev: FormEvent) => {
    ev.preventDefault();
    setServerError("");
    if (!validate()) return;
    setStatus("submitting");
    try {
      const res = await fetch("/api/support/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          orderNumber: form.orderNumber.trim() || undefined,
          category: form.category,
          subject: form.subject.trim(),
          message: form.message.trim(),
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (res.ok && body.success) {
        setTicketNumber(body.ticketNumber || "");
        setStatus("success");
      } else {
        setServerError(body.error || "Something went wrong. Please try again.");
        setStatus("error");
      }
    } catch {
      setServerError("Network error. Please check your connection and try again.");
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: DUR.section, ease: EASE_OUT_EXPO }}
        className="rounded-3xl border border-emerald-500/30 bg-emerald-500/10 p-8 text-center sm:p-10"
      >
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-300">
          <IconCheck />
        </div>
        <h2 className="mt-5 text-2xl font-black tracking-tight text-white">Request received</h2>
        <p className="mt-2 text-sm text-slate-300">
          Thanks — we've logged your request{ticketNumber ? <> as <span className="font-mono font-bold text-white">{ticketNumber}</span></> : ""}. Our team will reply to <span className="font-semibold text-white">{form.email}</span> as soon as possible.
        </p>
        <button
          type="button"
          onClick={() => { setForm({ name: "", email: "", orderNumber: "", category: "OTHER", subject: "", message: "" }); setStatus("idle"); setTicketNumber(""); }}
          className="mt-6 inline-flex rounded-full border border-white/15 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/10"
        >
          Submit another request
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div initial={reduce ? false : "hidden"} whileInView="show" viewport={viewportOnce} variants={fadeInUp}>
      <p className="text-xs font-bold uppercase tracking-[0.28em] text-accent-400">Still need help?</p>
      <h2 className="mt-3 text-2xl font-black tracking-tight sm:text-3xl">Contact support</h2>
      <p className="mt-2 text-sm text-slate-400">Send us the details and we'll get back to you. Fields marked * are required.</p>

      <form onSubmit={submit} noValidate className="mt-8 space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field id="name" label="Name *" error={errors.name}>
            <input id="name" value={form.name} onChange={(e) => set("name", e.target.value)} className="support-input" placeholder="Your name" autoComplete="name" />
          </Field>
          <Field id="email" label="Email *" error={errors.email}>
            <input id="email" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} className="support-input" placeholder="you@example.com" autoComplete="email" />
          </Field>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field id="orderNumber" label="Order number (optional)">
            <input id="orderNumber" value={form.orderNumber} onChange={(e) => set("orderNumber", e.target.value)} className="support-input" placeholder="e.g. ORD-XXXX" autoComplete="off" />
          </Field>
          <Field id="category" label="Category">
            <select id="category" value={form.category} onChange={(e) => set("category", e.target.value)} className="support-input support-select">
              {CONTACT_CATEGORIES.map((c) => (
                <option key={c} value={c} className="bg-ink-900 text-white">{CATEGORY_LABEL[c]}</option>
              ))}
            </select>
          </Field>
        </div>

        <Field id="subject" label="Subject *" error={errors.subject}>
          <input id="subject" value={form.subject} onChange={(e) => set("subject", e.target.value)} className="support-input" placeholder="A short summary" autoComplete="off" />
        </Field>

        <Field id="message" label="Message *" error={errors.message}>
          <textarea id="message" value={form.message} onChange={(e) => set("message", e.target.value)} rows={5} className="support-input support-textarea" placeholder="Tell us what's going on…" />
        </Field>

        <AnimatePresence initial={false}>
          {status === "error" && serverError && (
            <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: DUR.micro, ease: EASE_OUT_EXPO }} className="overflow-hidden rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {serverError}
            </motion.p>
          )}
        </AnimatePresence>

        <motion.button
          type="submit"
          disabled={status === "submitting"}
          whileTap={reduce ? undefined : { scale: 0.98 }}
          className="relative inline-flex w-full items-center justify-center rounded-full bg-accent-600 px-6 py-3.5 text-sm font-bold text-white shadow-glow transition-colors hover:bg-accent-500 disabled:opacity-70 sm:w-auto sm:px-10"
        >
          {status === "submitting" ? "Sending…" : "Send request"}
        </motion.button>
      </form>
    </motion.div>
  );
}

function Field({ id, label, error, children }: { id: string; label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-semibold text-slate-200">{label}</label>
      {children}
      {error && <p className="mt-1.5 text-xs text-red-300">{error}</p>}
    </div>
  );
}

/* ---------------------------------------------------------------- Icons (inline, no deps) */

function IconSearch() { return <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>; }
function IconArrow() { return <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>; }
function IconChevron() { return <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>; }
function IconCheck() { return <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>; }
function IconBag() { return <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" /><path d="M3 6h18M16 10a4 4 0 0 1-8 0" /></svg>; }
function IconTruck() { return <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M1 3h15v13H1zM16 8h4l3 3v5h-7" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" /></svg>; }
function IconPin() { return <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>; }
function IconBrush() { return <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M9.5 14.5 3 21s3 .5 5-1.5c1.5-1.5 1.5-3 1.5-3" /><path d="M14.5 9.5 20 4a2.8 2.8 0 0 0-4-4l-5.5 5.5" /><path d="m9.5 14.5 5-5 3 3-5 5z" /></svg>; }
function IconCard() { return <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 10h20" /></svg>; }
function IconReturn() { return <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M3 7v6h6" /><path d="M3 13a9 9 0 1 0 3-7.7L3 8" /></svg>; }
function IconChat() { return <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>; }
function IconHeadset() { return <svg viewBox="0 0 24 24" fill="none" className="h-16 w-16" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><path d="M4 14v-2a8 8 0 0 1 16 0v2" /><path d="M4 14a2 2 0 0 1 2-2h1v6H6a2 2 0 0 1-2-2zM20 14a2 2 0 0 0-2-2h-1v6h1a2 2 0 0 0 2-2z" /><path d="M20 16v1a4 4 0 0 1-4 4h-4" /></svg>; }
