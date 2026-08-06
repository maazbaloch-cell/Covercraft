"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useState } from "react";

export default function AdminNav() {
  const router = useRouter();
  const [showLogin, setShowLogin] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
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

  const handleAdminClick = () => router.push("/admin");

  const login = async (event: FormEvent) => {
    event.preventDefault();
    setError("");

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
  };

  return (
    <>
      <button
        type="button"
        onClick={handleAdminClick}
        className="text-sm hover:opacity-90"
      >
        Dashboard
      </button>

      {showLogin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Admin Login</h2>
              <button type="button" onClick={() => setShowLogin(false)} className="text-gray-500">
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
              {error && <p className="text-sm text-red-500">{error}</p>}
              <button type="submit" className="w-full rounded bg-brand px-4 py-2 text-white">
                Continue to Dashboard
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
