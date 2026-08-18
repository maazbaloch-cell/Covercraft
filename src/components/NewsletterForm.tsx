"use client";

import { FormEvent, useState } from "react";
import { motion } from "framer-motion";
import Spinner from "./Spinner";

type Status = "idle" | "loading" | "done" | "error";

/**
 * Newsletter opt-in. POSTs to /api/newsletter (rate-limited, idempotent upsert).
 * Styling is passed in so the same form works on the light hero band and the dark footer.
 */
export default function NewsletterForm({
  className = "",
  inputClassName = "min-w-0 flex-1 rounded-xl px-4 py-3 text-sm text-slate-900 outline-none",
  buttonClassName = "shrink-0 rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800 disabled:opacity-60",
  messageClassName = "text-violet-50",
}: {
  className?: string;
  inputClassName?: string;
  buttonClassName?: string;
  messageClassName?: string;
}) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setStatus("error");
      setMessage("Please enter a valid email address.");
      return;
    }
    setStatus("loading");
    setMessage("");
    try {
      const res = await fetch("/api/newsletter", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus("error");
        setMessage(body.error || "Unable to subscribe right now. Please try again.");
        return;
      }
      setStatus("done");
      setMessage("You're on the list — welcome to CoverCraft.");
      setEmail("");
    } catch {
      setStatus("error");
      setMessage("We couldn't reach the server. Please try again.");
    }
  };

  if (status === "done") {
    return (
      <p role="status" className={`text-sm font-bold ${messageClassName}`}>
        ✓ {message}
      </p>
    );
  }

  return (
    <form onSubmit={submit} className={className} noValidate>
      <div className="flex gap-2">
        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Your email address" aria-label="Email address" className={inputClassName} />
        <motion.button whileHover={status === "loading" ? undefined : { scale: 1.03 }} whileTap={{ scale: 0.97 }} disabled={status === "loading"} className={`relative ${buttonClassName}`}>
          <span className={status === "loading" ? "opacity-0" : ""}>Join us</span>
          {status === "loading" && <span className="absolute inset-0 flex items-center justify-center"><Spinner /></span>}
        </motion.button>
      </div>
      {status === "error" && (
        <p role="alert" className={`mt-2 text-xs font-semibold ${messageClassName}`}>
          {message}
        </p>
      )}
    </form>
  );
}
