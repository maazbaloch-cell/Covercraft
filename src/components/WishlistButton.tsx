"use client";

import { MouseEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useToast } from "@/lib/toastStore";
import { DUR, EASE_OUT_EXPO } from "@/lib/motion";

/**
 * Heart toggle backed by /api/customer/wishlist (POST to add, DELETE to remove).
 * Optimistic: flips immediately and reverts on failure. A 401 means the visitor
 * isn't signed in, so we send them to /account to log in first.
 */
export default function WishlistButton({
  productId,
  title,
  initial = false,
  className = "",
}: {
  productId: string;
  title: string;
  initial?: boolean;
  className?: string;
}) {
  const router = useRouter();
  const [active, setActive] = useState(initial);
  const [busy, setBusy] = useState(false);
  // `initial` can arrive after mount (e.g. the PDP resolves saved-state asynchronously).
  // Adopt it until the visitor interacts, after which their action is authoritative.
  const touched = useRef(false);
  useEffect(() => { if (!touched.current) setActive(initial); }, [initial]);

  const toggle = async (event: MouseEvent) => {
    // The button often sits on top of a product link — never navigate on click.
    event.preventDefault();
    event.stopPropagation();
    if (busy) return;
    touched.current = true;
    setBusy(true);
    const next = !active;
    setActive(next); // optimistic
    try {
      const res = next
        ? await fetch("/api/customer/wishlist", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ productId }) })
        : await fetch(`/api/customer/wishlist?productId=${encodeURIComponent(productId)}`, { method: "DELETE", credentials: "include" });
      if (res.status === 401) {
        setActive(!next);
        useToast.getState().push("Sign in to save covers", "error");
        router.push("/account");
        return;
      }
      if (!res.ok) {
        setActive(!next); // revert on server error
        useToast.getState().push("Couldn't update your wishlist", "error");
        return;
      }
      useToast.getState().push(next ? `Saved ${title} to your wishlist` : `Removed ${title} from your wishlist`);
    } catch {
      setActive(!next); // revert on network error
      useToast.getState().push("Network error — please try again", "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <motion.button
      type="button"
      onClick={toggle}
      disabled={busy}
      aria-pressed={active}
      aria-label={active ? `Remove ${title} from wishlist` : `Add ${title} to wishlist`}
      whileHover={{ scale: 1.12 }}
      whileTap={{ scale: 0.82 }}
      transition={{ duration: DUR.micro, ease: EASE_OUT_EXPO }}
      className={`${className} ${active ? "bg-rose-500 text-white" : "bg-white/90 text-slate-700 hover:bg-slate-950 hover:text-white"}`}
    >
      <motion.span
        aria-hidden
        animate={active ? { scale: touched.current ? [1, 1.4, 1] : 1 } : { scale: 1 }}
        transition={{ duration: 0.36, ease: EASE_OUT_EXPO }}
        className="block leading-none"
      >
        {active ? "♥" : "♡"}
      </motion.span>
    </motion.button>
  );
}
