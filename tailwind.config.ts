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
      },
    },
  },
  plugins: [],
};
export default config;

