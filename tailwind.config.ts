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
          DEFAULT: "#0b1120", // near-black slate — primary dark
          accent: "#2563eb", // blue-600 — brand accent
        },
        // Cinematic redesign palette. `ink` = the deep, layered canvas used by immersive
        // surfaces (home, product worlds, product detail). `accent` = the BRAND BLUE light
        // that carries through glows, gradients and focus states across the whole site.
        ink: {
          950: "#04060d", // base canvas — near-black with a cool blue cast
          900: "#070b16",
          850: "#0a0f1d",
          800: "#0e1424",
          700: "#141b30",
          600: "#1c2540",
          500: "#273154",
        },
        // Brand blue — the single UI accent. Premium, cool, high-tech.
        accent: {
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8", // == brand.accent family
          800: "#1e40af",
        },
        // Product/cover accent — used ONLY for the hero phone case & product art,
        // never for UI chrome (keeps the interface strictly blue + black).
        cover: {
          300: "#fdba74",
          400: "#fb923c",
          500: "#f97316",
          600: "#ea580c",
          700: "#c2410c",
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
        glow: "0 0 44px -8px rgb(37 99 235 / 0.55)",
        "glow-sm": "0 0 24px -6px rgb(37 99 235 / 0.5)",
        depth: "0 30px 60px -22px rgb(0 0 0 / 0.6)",
        "depth-lg": "0 55px 110px -30px rgb(0 0 0 / 0.78)",
      },
      backgroundImage: {
        // Ambient cinematic backdrop (used behind immersive scenes) — brand blue.
        aurora:
          "radial-gradient(60% 60% at 20% 15%, rgb(37 99 235 / 0.30), transparent 60%), radial-gradient(50% 50% at 85% 25%, rgb(56 189 248 / 0.14), transparent 55%), radial-gradient(70% 70% at 60% 100%, rgb(29 78 216 / 0.32), transparent 60%)",
      },
      keyframes: {
        "aurora-drift": {
          "0%, 100%": { transform: "translate3d(0, 0, 0) scale(1)" },
          "50%": { transform: "translate3d(2%, -3%, 0) scale(1.08)" },
        },
        "pulse-glow": {
          "0%, 100%": { opacity: "0.45" },
          "50%": { opacity: "1" },
        },
      },
      animation: {
        // Ambient loops. All auto-neutralised under prefers-reduced-motion by globals.css.
        "aurora-drift": "aurora-drift 20s ease-in-out infinite",
        "pulse-glow": "pulse-glow 3.6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
