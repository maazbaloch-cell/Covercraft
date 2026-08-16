"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

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

  return <div className="mx-auto flex min-h-[calc(100vh-15rem)] max-w-md flex-col justify-center px-6 py-12">
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_18px_45px_rgb(15_23_42_/_0.08)]">
      <div className="bg-slate-950 px-7 py-8 text-white"><p className="text-xs font-bold uppercase tracking-[.2em] text-violet-300">CoverCraft account</p><h1 className="mt-3 text-3xl font-black">{mode === "login" ? "Welcome back." : mode === "signup" ? "Make it yours." : "Reset password."}</h1><p className="mt-2 text-sm leading-6 text-slate-300">{mode === "login" ? "Sign in to keep your CoverCraft details together." : mode === "signup" ? "Create an account for a faster, more personal checkout." : "We'll email you a 6-digit code to set a new password."}</p></div>
      <div className="p-6 sm:p-7">
        {mode !== "reset" && <div className="mb-6 grid grid-cols-2 rounded-xl bg-slate-100 p-1 text-sm font-bold"><button type="button" onClick={() => switchMode("login")} className={`rounded-lg py-2 transition ${mode === "login" ? "bg-white text-slate-950 shadow-sm" : "text-slate-500"}`}>Sign in</button><button type="button" onClick={() => switchMode("signup")} className={`rounded-lg py-2 transition ${mode === "signup" ? "bg-white text-slate-950 shadow-sm" : "text-slate-500"}`}>Create account</button></div>}
        {notice && <p className="mb-4 rounded-xl bg-emerald-50 px-3 py-2.5 text-sm text-emerald-700">{notice}</p>}

        {mode === "reset" ? (
          resetStep === "request" ? (
            <form onSubmit={requestReset} className="space-y-4">
              <label className="block text-sm font-semibold text-slate-700">Email address<input required autoComplete="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-slate-900" placeholder="you@example.com" /></label>
              {error && <p role="alert" className="rounded-xl bg-rose-50 px-3 py-2.5 text-sm text-rose-700">{error}</p>}
              <button disabled={loading} className="w-full rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60">{loading ? "Please wait…" : "Send reset code"}</button>
            </form>
          ) : (
            <form onSubmit={confirmReset} className="space-y-4">
              <label className="block text-sm font-semibold text-slate-700">6-digit code<input required inputMode="numeric" maxLength={6} value={resetCode} onChange={(e) => setResetCode(e.target.value.replace(/\D/g, "").slice(0, 6))} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-center tracking-[0.4em] text-slate-900" placeholder="123456" /></label>
              <label className="block text-sm font-semibold text-slate-700">New password<input required type="password" minLength={12} value={resetPassword} onChange={(e) => setResetPassword(e.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-slate-900" placeholder="At least 12 characters" /></label>
              {error && <p role="alert" className="rounded-xl bg-rose-50 px-3 py-2.5 text-sm text-rose-700">{error}</p>}
              <button disabled={loading} className="w-full rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60">{loading ? "Please wait…" : "Reset password"}</button>
              <button type="button" onClick={requestReset} className="w-full text-center text-sm font-bold text-violet-700">Resend code</button>
            </form>
          )
        ) : (
          <form onSubmit={submit} className="space-y-4">
            {mode === "signup" && <label className="block text-sm font-semibold text-slate-700">Full name<input required autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-slate-900" placeholder="Your name" /></label>}
            <label className="block text-sm font-semibold text-slate-700">Email address<input required autoComplete="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-slate-900" placeholder="you@example.com" /></label>
            <label className="block text-sm font-semibold text-slate-700">Password<input required autoComplete={mode === "login" ? "current-password" : "new-password"} type="password" minLength={mode === "signup" ? 12 : undefined} value={password} onChange={(event) => setPassword(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-slate-900" placeholder={mode === "signup" ? "At least 12 characters" : "Your password"} /></label>
            {mode === "login" && <button type="button" onClick={() => switchMode("reset")} className="block text-left text-sm font-bold text-violet-700">Forgot password?</button>}
            {error && <p role="alert" className="rounded-xl bg-rose-50 px-3 py-2.5 text-sm text-rose-700">{error}</p>}
            <button disabled={loading} className="w-full rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60">{loading ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}</button>
          </form>
        )}

        {mode === "reset" ? (
          <p className="mt-5 text-center text-xs leading-5 text-slate-500">Remembered it? <button type="button" onClick={() => switchMode("login")} className="font-bold text-violet-700">Back to sign in</button></p>
        ) : (
          <p className="mt-5 text-center text-xs leading-5 text-slate-500">{mode === "signup" ? "Your account uses a secure, encrypted password." : "New to CoverCraft? "}<button type="button" onClick={() => switchMode(mode === "login" ? "signup" : "login")} className="font-bold text-violet-700">{mode === "login" ? "Create an account" : "Sign in instead"}</button></p>
        )}
        <Link href="/" className="mt-5 block text-center text-sm font-bold text-violet-700">Continue shopping →</Link>
      </div>
    </div>
  </div>;
}
