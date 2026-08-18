"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { DUR_CINEMA, EASE_CINEMATIC } from "@/lib/motion";
import AuthShowcase from "@/components/account/AuthShowcase";

type Mode = "login" | "signup" | "reset";

export default function AccountPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);
  // Password reset sub-flow
  const [resetStep, setResetStep] = useState<"request" | "confirm">("request");
  const [resetCode, setResetCode] = useState("");
  const [resetPassword, setResetPassword] = useState("");

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setNotice("");
    if (mode === "signup" && !name.trim()) return setError("Please enter your name.");
    if (!/^\S+@\S+\.\S+$/.test(email)) return setError("Please enter a valid email address.");
    if (mode === "signup" && password.length < 12) return setError("Your password must be at least 12 characters.");
    if (mode === "login" && !password) return setError("Please enter your password.");
    setLoading(true);
    try {
      const response = await fetch(`/api/customer/${mode}`, { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ name, email, password }) });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) return setError(body.error || "Something went wrong. Please try again.");
      router.replace("/account/dashboard");
      router.refresh();
    } catch {
      setError("We could not reach the server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const requestReset = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setNotice("");
    if (!/^\S+@\S+\.\S+$/.test(email)) return setError("Please enter a valid email address.");
    setLoading(true);
    try {
      await fetch("/api/customer/password/forgot", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
      setResetStep("confirm");
      setNotice("If an account exists for that email, we've sent a 6-digit reset code.");
    } catch {
      setError("We could not reach the server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const confirmReset = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setNotice("");
    if (!/^\d{6}$/.test(resetCode)) return setError("Enter the 6-digit code from your email.");
    if (resetPassword.length < 12) return setError("Your new password must be at least 12 characters.");
    setLoading(true);
    try {
      const response = await fetch("/api/customer/password/reset", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, code: resetCode, newPassword: resetPassword }) });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) return setError(body.error || "Unable to reset your password.");
      switchMode("login");
      setNotice("Password updated. Please sign in with your new password.");
    } catch {
      setError("We could not reach the server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (next: Mode) => {
    setMode(next); setError(""); setNotice(""); setPassword("");
    setResetStep("request"); setResetCode(""); setResetPassword("");
  };

  // Shared dark-cinematic input skin. Idle is a subtle glass field; the global
  // input:focus rule (globals.css) layers the accent border + ring on focus.
  const inputClass = "mt-1.5 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-white placeholder:text-slate-500";

  return <div className="cinematic-scene relative isolate flex min-h-screen items-center justify-center overflow-x-clip px-6 py-16">
    {/* Ambient wash — this is the storefront "enter" moment, so the auth card
        sits on a continuous cinematic surface between the dark header + footer. */}
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-aurora opacity-60" />
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-grain opacity-[0.15]" />

    <div className="mx-auto grid w-full max-w-5xl items-center gap-10 lg:grid-cols-2">
      <AuthShowcase mode={mode} />
      <motion.div initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: DUR_CINEMA.entrance, ease: EASE_CINEMATIC }} className="mx-auto w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] shadow-depth-lg backdrop-blur-xl">
      <div className="relative overflow-hidden border-b border-white/10 bg-gradient-to-br from-accent-800/50 via-ink-850 to-ink-900 px-7 py-8">
        <div aria-hidden className="glow-ring pointer-events-none absolute -right-10 -top-16 h-40 w-40 rounded-full opacity-50" />
        <p className="text-xs font-bold uppercase tracking-[.2em] text-accent-300">CoverCraft account</p>
        <h1 className="mt-3 font-display text-3xl font-black tracking-cinema text-white">{mode === "login" ? "Welcome back." : mode === "signup" ? "Make it yours." : "Reset password."}</h1>
        <p className="mt-2 text-sm leading-6 text-slate-300">{mode === "login" ? "Sign in to keep your CoverCraft details together." : mode === "signup" ? "Create an account for a faster, more personal checkout." : "We'll email you a 6-digit code to set a new password."}</p>
      </div>
      <div className="p-6 sm:p-7">
        {mode !== "reset" && <div className="mb-6 grid grid-cols-2 rounded-xl border border-white/10 bg-white/5 p-1 text-sm font-bold"><button type="button" onClick={() => switchMode("login")} className={`rounded-lg py-2 transition ${mode === "login" ? "bg-accent-600 text-white shadow-glow-sm" : "text-slate-400 hover:text-slate-200"}`}>Sign in</button><button type="button" onClick={() => switchMode("signup")} className={`rounded-lg py-2 transition ${mode === "signup" ? "bg-accent-600 text-white shadow-glow-sm" : "text-slate-400 hover:text-slate-200"}`}>Create account</button></div>}
        {notice && <p className="mb-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2.5 text-sm text-emerald-300">{notice}</p>}

        {mode === "reset" ? (
          resetStep === "request" ? (
            <form onSubmit={requestReset} className="space-y-4">
              <label className="block text-sm font-semibold text-slate-300">Email address<input required autoComplete="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} placeholder="you@example.com" /></label>
              {error && <p role="alert" className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2.5 text-sm text-rose-300">{error}</p>}
              <button disabled={loading} className="w-full rounded-xl bg-accent-600 px-5 py-3 text-sm font-bold text-white shadow-glow transition hover:bg-accent-500 disabled:cursor-not-allowed disabled:opacity-60">{loading ? "Please wait…" : "Send reset code"}</button>
            </form>
          ) : (
            <form onSubmit={confirmReset} className="space-y-4">
              <label className="block text-sm font-semibold text-slate-300">6-digit code<input required inputMode="numeric" maxLength={6} value={resetCode} onChange={(e) => setResetCode(e.target.value.replace(/\D/g, "").slice(0, 6))} className={`${inputClass} text-center tracking-[0.4em]`} placeholder="123456" /></label>
              <label className="block text-sm font-semibold text-slate-300">New password<input required type="password" minLength={12} value={resetPassword} onChange={(e) => setResetPassword(e.target.value)} className={inputClass} placeholder="At least 12 characters" /></label>
              {error && <p role="alert" className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2.5 text-sm text-rose-300">{error}</p>}
              <button disabled={loading} className="w-full rounded-xl bg-accent-600 px-5 py-3 text-sm font-bold text-white shadow-glow transition hover:bg-accent-500 disabled:cursor-not-allowed disabled:opacity-60">{loading ? "Please wait…" : "Reset password"}</button>
              <button type="button" onClick={requestReset} className="w-full text-center text-sm font-bold text-accent-300 transition hover:text-accent-200">Resend code</button>
            </form>
          )
        ) : (
          <form onSubmit={submit} className="space-y-4">
            {mode === "signup" && <label className="block text-sm font-semibold text-slate-300">Full name<input required autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} className={inputClass} placeholder="Your name" /></label>}
            <label className="block text-sm font-semibold text-slate-300">Email address<input required autoComplete="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} className={inputClass} placeholder="you@example.com" /></label>
            <label className="block text-sm font-semibold text-slate-300">Password<input required autoComplete={mode === "login" ? "current-password" : "new-password"} type="password" minLength={mode === "signup" ? 12 : undefined} value={password} onChange={(event) => setPassword(event.target.value)} className={inputClass} placeholder={mode === "signup" ? "At least 12 characters" : "Your password"} /></label>
            {mode === "login" && <button type="button" onClick={() => switchMode("reset")} className="block text-left text-sm font-bold text-accent-300 transition hover:text-accent-200">Forgot password?</button>}
            {error && <p role="alert" className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2.5 text-sm text-rose-300">{error}</p>}
            <button disabled={loading} className="w-full rounded-xl bg-accent-600 px-5 py-3 text-sm font-bold text-white shadow-glow transition hover:bg-accent-500 disabled:cursor-not-allowed disabled:opacity-60">{loading ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}</button>
          </form>
        )}

        {mode === "reset" ? (
          <p className="mt-5 text-center text-xs leading-5 text-slate-400">Remembered it? <button type="button" onClick={() => switchMode("login")} className="font-bold text-accent-300 transition hover:text-accent-200">Back to sign in</button></p>
        ) : (
          <p className="mt-5 text-center text-xs leading-5 text-slate-400">{mode === "signup" ? "Your account uses a secure, encrypted password." : "New to CoverCraft? "}<button type="button" onClick={() => switchMode(mode === "login" ? "signup" : "login")} className="font-bold text-accent-300 transition hover:text-accent-200">{mode === "login" ? "Create an account" : "Sign in instead"}</button></p>
        )}
        <Link href="/shop" className="mt-5 block text-center text-sm font-bold text-accent-300 transition hover:text-accent-200">Continue shopping →</Link>
      </div>
    </motion.div>
    </div>
  </div>;
}
