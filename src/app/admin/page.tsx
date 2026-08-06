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
    <div className="mx-auto flex min-h-[calc(100vh-11rem)] max-w-sm flex-col justify-center px-6 py-10">
      <h1 className="text-2xl font-bold mb-6 text-center">Admin Login</h1>
      <form onSubmit={login} className="space-y-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <input
            autoComplete="email"
            className="border rounded px-3 py-2 w-full bg-white text-gray-900 placeholder-gray-400"
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
            className="border rounded px-3 py-2 w-full bg-white text-gray-900 placeholder-gray-400"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button type="submit" className="bg-brand text-white px-5 py-2 rounded-lg w-full">
          Login
        </button>
      </form>
    </div>
  );
}
