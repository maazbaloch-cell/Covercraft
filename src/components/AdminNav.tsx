"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Spinner from "./Spinner";
import { DUR, EASE_OUT_EXPO } from "@/lib/motion";

export default function AdminNav() {
  const router = useRouter();
  const [showLogin, setShowLogin] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/admin/orders", { credentials: "include" });
        setIsAuthenticated(res.ok);
      } catch {
        setIsAuthenticated(false);
      }
    };

    checkAuth();
  }, []);

  // Close the login modal on Escape while it's open.
  useEffect(() => {
    if (!showLogin) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setShowLogin(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showLogin]);

  const handleAdminClick = () => router.push("/admin");

  const login = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (res.ok) {
        setIsAuthenticated(true);
        setShowLogin(false);
        router.push("/admin/dashboard");
      } else {
        setError("Invalid email or password.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleAdminClick}
        className="text-sm transition-opacity hover:opacity-80 active:scale-95"
      >
        Dashboard
      </button>

      <AnimatePresence>
        {showLogin && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: DUR.base, ease: EASE_OUT_EXPO }}
          >
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowLogin(false)} />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Admin login"
              className="relative w-full max-w-sm rounded-xl bg-white p-6 shadow-2xl"
              initial={{ opacity: 0, scale: 0.94, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 12 }}
              transition={{ duration: DUR.base, ease: EASE_OUT_EXPO }}
            >
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold">Admin Login</h2>
                <button type="button" onClick={() => setShowLogin(false)} className="text-gray-500 transition-colors hover:text-gray-800 active:scale-90">
                  ×
                </button>
              </div>
              <form onSubmit={login} className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    autoComplete="email"
                    className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder-gray-400"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Password</label>
                  <input
                    autoComplete="current-password"
                    type="password"
                    className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder-gray-400"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <AnimatePresence initial={false}>
                  {error && <motion.p key="err" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: DUR.micro, ease: EASE_OUT_EXPO }} className="overflow-hidden text-sm text-red-500">{error}</motion.p>}
                </AnimatePresence>
                <motion.button whileTap={{ scale: 0.98 }} type="submit" disabled={submitting} className="relative w-full rounded bg-brand px-4 py-2 text-white transition-colors hover:bg-brand-accent disabled:opacity-70">
                  <span className={submitting ? "opacity-0" : ""}>Continue to Dashboard</span>
                  {submitting && <span className="absolute inset-0 flex items-center justify-center"><Spinner /></span>}
                </motion.button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
