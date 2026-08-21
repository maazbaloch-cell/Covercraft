import Link from "next/link";
import NewsletterSignup from "@/components/NewsletterSignup";

/**
 * StoreFooter — the global premium footer (rendered once in app/layout.tsx, so
 * it appears site-wide). Sits on the same ink-950 base as every page, with a
 * thin blue top glow and hairline separators, so it reads as a continuous
 * surface with the header and page above it (no separate colour block).
 *
 * Every link points at a route that actually exists. The brand name is kept as
 * "CoverCraft" to match the global header — a different wordmark here would read
 * as a different site.
 */

type LinkTuple = readonly [label: string, href: string];

const shopLinks: LinkTuple[] = [
  ["All Covers", "/shop"],
  ["Customize Your Cover", "/customize-cover"],
  ["Track Order", "/track"],
  ["Saved Covers", "/wishlist"],
];
const helpLinks: LinkTuple[] = [
  ["Support Center", "/support"],
  ["File a Complaint", "/complaint"],
  ["Track Order", "/track"],
  ["FAQ", "/support"],
];
const accountLinks: LinkTuple[] = [
  ["Sign In", "/account"],
  ["Create Account", "/account"],
  ["My Orders", "/account/dashboard"],
  ["Your Cart", "/cart"],
];
const companyLinks: LinkTuple[] = [
  ["About Us", "/about"],
  ["Contact", "/support"],
  ["Privacy Policy", "/privacy"],
  ["Terms & Conditions", "/terms"],
];

function FooterColumn({ title, links }: { title: string; links: LinkTuple[] }) {
  return (
    <div>
      <h3 className="footer-col-title">{title}</h3>
      <ul className="space-y-2.5">
        {links.map(([label, href]) => (
          <li key={label + href}>
            <Link href={href} className="footer-link">{label}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function StoreFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="site-footer">
      <div className="relative mx-auto max-w-7xl px-6 py-16">
        {/* Top area: brand + link columns */}
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-6">
          <div className="sm:col-span-2">
            <Link href="/" className="inline-flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-accent-500 to-accent-700 text-base font-black text-white shadow-glow">C</span>
              <span className="text-lg font-black tracking-tight text-white">CoverCraft</span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-6 text-slate-400">
              Premium mobile covers designed around your device — protection with a look that feels unmistakably yours.
            </p>
          </div>

          <FooterColumn title="Shop" links={shopLinks} />
          <FooterColumn title="Help" links={helpLinks} />
          <FooterColumn title="Account" links={accountLinks} />
          <FooterColumn title="Company" links={companyLinks} />
        </div>

        {/* Newsletter band */}
        <div className="mt-14 flex flex-col gap-6 border-t border-white/10 pt-10 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-xl font-black tracking-tight text-white">Stay in the loop.</h3>
            <p className="mt-1.5 text-sm text-slate-400">Get updates about new designs, offers and launches.</p>
          </div>
          <div className="w-full lg:max-w-md">
            <NewsletterSignup />
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col gap-4 border-t border-white/10 pt-7 text-sm sm:flex-row sm:items-center sm:justify-between">
          <p className="text-slate-500">© {year} CoverCraft. All rights reserved.</p>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <Link href="/privacy" className="footer-bottom-link">Privacy Policy</Link>
            <Link href="/terms" className="footer-bottom-link">Terms &amp; Conditions</Link>
            <Link href="/refund-policy" className="footer-bottom-link">Refund Policy</Link>
            <span className="inline-flex items-center gap-1.5 text-slate-400">
              <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 text-accent-300" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden><rect x="4" y="11" width="16" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>
              Secure Shopping
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
