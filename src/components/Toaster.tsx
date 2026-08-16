"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useToast } from "@/lib/toastStore";
import { DUR, EASE_OUT_EXPO } from "@/lib/motion";

/** Renders the global toast queue as dismissible pills fixed to the bottom of the screen. */
export default function Toaster() {
  const toasts = useToast((s) => s.toasts);
  const dismiss = useToast((s) => s.dismiss);

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[100] flex flex-col items-center gap-2 px-4" aria-live="polite" role="status">
      <AnimatePresence initial={false}>
        {toasts.map((t) => (
          <motion.button
            key={t.id}
            type="button"
            layout
            onClick={() => dismiss(t.id)}
            initial={{ opacity: 0, y: 24, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.9 }}
            transition={{ duration: DUR.base, ease: EASE_OUT_EXPO }}
            className={`pointer-events-auto max-w-full rounded-full px-4 py-2.5 text-sm font-semibold text-white shadow-lg ${t.tone === "error" ? "bg-rose-600" : "bg-slate-900"}`}
          >
            {t.message}
          </motion.button>
        ))}
      </AnimatePresence>
    </div>
  );
}
