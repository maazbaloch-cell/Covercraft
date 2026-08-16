import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // Canonical brand palette. These mirror the storefront's slate-950 + violet accent
        // so the "app" surfaces (cart, checkout, admin, designer) that use `brand`/`brand-accent`
        // stay visually consistent with the marketing pages. Change these two values to re-skin.
        brand: {
          DEFAULT: "#0f172a", // slate-950 — primary dark
          accent: "#6d28d9", // violet-700 — accent (matches storefront hover:bg-violet-700)
        },
        // Cinematic redesign palette (Phase 2). `ink` = the deep, layered canvas used by
        // immersive surfaces (home, product worlds, product detail). `accent` = the violet
        // brand light that carries through glows, gradients and focus states.
        ink: {
          950: "#050609", // base canvas — near-black with a cool cast
          900: "#0a0b12",
          850: "#0d0f19",
          800: "#111320",
          700: "#171a2b",
          600: "#1f2338",
          500: "#2a2f4a",
        },
        accent: {
          300: "#c4b5fd",
          400: "#a78bfa",
          500: "#8b5cf6",
          600: "#7c3aed",
          700: "#6d28d9", // == brand.accent
          800: "#5b21b6",
        },
      },
      fontFamily: {
        // Bound to the next/font CSS variables set on <html> (see src/lib/fonts.ts).
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      letterSpacing: {
        cinema: "-0.045em", // tight display tracking for large cinematic headlines
      },
      boxShadow: {
        glow: "0 0 44px -8px rgb(124 58 237 / 0.55)",
        "glow-sm": "0 0 24px -6px rgb(124 58 237 / 0.5)",
        depth: "0 30px 60px -22px rgb(0 0 0 / 0.6)",
        "depth-lg": "0 55px 110px -30px rgb(0 0 0 / 0.78)",
      },
      backgroundImage: {
        // Ambient cinematic backdrop (used behind immersive scenes).
        aurora:
          "radial-gradient(60% 60% at 20% 15%, rgb(124 58 237 / 0.28), transparent 60%), radial-gradient(50% 50% at 85% 25%, rgb(56 189 248 / 0.14), transparent 55%), radial-gradient(70% 70% at 60% 100%, rgb(91 33 182 / 0.30), transparent 60%)",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translate3d(0, 0, 0)" },
          "50%": { transform: "translate3d(0, -14px, 0)" },
        },
        "aurora-drift": {
          "0%, 100%": { transform: "translate3d(0, 0, 0) scale(1)" },
          "50%": { transform: "translate3d(2%, -3%, 0) scale(1.08)" },
        },
        "pulse-glow": {
          "0%, 100%": { opacity: "0.45" },
          "50%": { opacity: "1" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        // Ambient loops. All auto-neutralised under prefers-reduced-motion by globals.css.
        float: "float 6.5s ease-in-out infinite",
        "aurora-drift": "aurora-drift 20s ease-in-out infinite",
        "pulse-glow": "pulse-glow 3.6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
