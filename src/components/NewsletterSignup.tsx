"use client";

import { useState } from "react";

/**
 * Footer newsletter signup — posts to the real /api/newsletter route
 * (upserts a NewsletterSubscriber). Honest states only: it reports the
 * actual server response, never a fake success.
 */
export default function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "err">("idle");
  const [message, setMessage] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = email.trim();
    if (!/.+@.+\..+/.test(value)) {
      setStatus("err");
      setMessage("Enter a valid email address.");
      return;
    }
    setStatus("loading");
    setMessage("");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: value }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus("err");
        setMessage(data.error || "Unable to subscribe right now.");
        return;
      }
      setStatus("ok");
      setMessage("You're on the list — thanks for subscribing!");
      setEmail("");
    } catch {
      setStatus("err");
      setMessage("Network error. Please try again.");
    }
  };

  return (
    <div>
      <form onSubmit={submit} className="flex gap-2" noValidate>
        <input
          type="email"
          inputMode="email"
          aria-label="Email address"
          placeholder="you@email.com"
          value={email}
          onChange={(e) => { setEmail(e.target.value); if (status !== "idle") { setStatus("idle"); setMessage(""); } }}
          className="footer-news-input"
        />
        <button type="submit" disabled={status === "loading"} className="footer-news-btn">
          {status === "loading" ? "…" : "Subscribe"}
        </button>
      </form>
      {message && (
        <p className={`footer-news-msg ${status === "ok" ? "is-ok" : "is-err"}`} role={status === "err" ? "alert" : undefined}>
          {message}
        </p>
      )}
    </div>
  );
}
