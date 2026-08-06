import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";
import AdminNav from "../components/AdminNav";
import StoreFooter from "../components/StoreFooter";

export const metadata: Metadata = {
  title: "CoverCraft — Mobile Back Covers",
  description: "Custom mobile back covers, designs & templates",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/95 px-4 py-3 text-white shadow-lg backdrop-blur sm:px-6">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4"><Link href="/" className="flex items-center gap-2 font-black tracking-tight text-lg sm:text-xl"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-600 text-sm">C</span>CoverCraft</Link>
          <nav className="flex items-center gap-3 overflow-x-auto text-xs font-semibold text-slate-200 sm:gap-5 sm:text-sm">
            <Link href="/">Shop</Link>
            <Link href="/customize-cover">Customize</Link>
            <Link href="/track">Track Order</Link>
            <Link href="/cart">Cart</Link>
            <Link href="/account">Account</Link>
            <AdminNav />
            <Link href="/complaint">Support</Link>
          </nav></div>
        </header>
        <main>{children}</main>
        <StoreFooter />{/*
          © {new Date().getFullYear()} CoverCraft. All rights reserved.
        */}
      </body>
    </html>
  );
}
