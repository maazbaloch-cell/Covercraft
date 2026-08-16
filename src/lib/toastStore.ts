import { create } from "zustand";

export type ToastTone = "success" | "error";
interface Toast {
  id: number;
  message: string;
  tone: ToastTone;
}
interface ToastState {
  toasts: Toast[];
  push: (message: string, tone?: ToastTone) => void;
  dismiss: (id: number) => void;
}

let seq = 0;

/**
 * Tiny global toast store (same zustand pattern as the cart). Fire from anywhere with
 * `useToast.getState().push("Saved")` — no provider needed; <Toaster/> in the root layout
 * renders the queue. Each toast auto-dismisses after ~2.6s.
 */
export const useToast = create<ToastState>((set) => ({
  toasts: [],
  push: (message, tone = "success") => {
    seq += 1;
    const id = seq;
    set((state) => ({ toasts: [...state.toasts, { id, message, tone }] }));
    setTimeout(() => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })), 2600);
  },
  dismiss: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));
