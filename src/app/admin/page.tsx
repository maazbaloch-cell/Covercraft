"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/admin/orders", { credentials: "include" });
        if (res.ok) {
          router.replace("/admin/dashboard");
        }
      } catch {
        // stay on login page
      }
    };

    checkAuth();
  }, [router]);

  const login = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
      credentials: "include",
    });
    if (res.ok) {
      router.replace("/admin/dashboard");
    } else {
      setError("Invalid email or password.");
    }
  };

  return (
    <div className="cinematic-scene flex min-h-[calc(100vh-11rem)] w-full flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <span className="inline-flex items-center gap-2 text-lg font-black tracking-tight text-white">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-accent-400 to-accent-600 text-sm text-white shadow-glow-sm">C</span>
            CoverCraft
            <span className="text-white/30">·</span>
            <span className="text-sm font-semibold uppercase tracking-[0.18em] text-accent-400">Admin</span>
          </span>
          <p className="mt-3 text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-accent-400/80">Operations center</p>
        </div>

        <div className="glass rounded-2xl p-6 shadow-depth sm:p-8">
          <h1 className="mb-6 text-center text-2xl font-bold text-white">Admin Login</h1>
          <form onSubmit={login} className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-white/70">Email</label>
              <input
                autoComplete="email"
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white placeholder-white/40 outline-none transition focus:border-accent-500 focus:ring-2 focus:ring-accent-500/30"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-white/70">Password</label>
              <input
                autoComplete="current-password"
                type="password"
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white placeholder-white/40 outline-none transition focus:border-accent-500 focus:ring-2 focus:ring-accent-500/30"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <button
              type="submit"
              className="w-full rounded-lg bg-accent-600 px-5 py-2.5 font-semibold text-white shadow-glow transition-transform hover:scale-[1.01] hover:bg-accent-500 active:scale-95"
            >
              Login
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
