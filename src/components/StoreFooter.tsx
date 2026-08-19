import Link from "next/link";

const shopLinks = [["Shop covers", "/shop"], ["Customise a cover", "/customize-cover"], ["Track an order", "/track"]];
const helpLinks = [["Support", "/complaint"], ["Your cart", "/cart"], ["Saved covers", "/wishlist"], ["Your account", "/account"]];

export default function StoreFooter() {
  return <footer className="relative bg-ink-950 text-slate-300"><div aria-hidden className="pointer-events-none absolute inset-x-0 -top-28 h-28 bg-gradient-to-b from-transparent to-ink-950" /><div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent-500/30 to-transparent" /><div className="relative mx-auto max-w-7xl px-6 py-12 sm:py-14"><div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1.2fr]"><div><Link href="/" className="inline-flex items-center gap-2 text-lg font-black tracking-tight text-white"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-accent-400 to-accent-600 text-sm shadow-glow-sm">C</span>CoverCraft</Link><p className="mt-4 max-w-xs text-sm leading-6 text-slate-400">Protective mobile covers with a look that feels unmistakably yours.</p></div><FooterLinks title="Shop" links={shopLinks}/><FooterLinks title="Help" links={helpLinks}/><div><h2 className="text-sm font-bold text-white">Shop with confidence</h2><ul className="mt-4 space-y-3 text-sm text-slate-400"><li>Secure EasyPaisa checkout</li><li>Fast dispatch across Pakistan</li><li>Support seven days a week</li></ul></div></div><div className="mt-10 flex flex-col gap-3 border-t border-white/10 pt-6 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between"><p>© {new Date().getFullYear()} CoverCraft. All rights reserved.</p><p>Made for devices that go everywhere.</p></div></div></footer>;
}

function FooterLinks({ title, links }: { title: string; links: string[][] }) {
  return <div><h2 className="text-sm font-bold text-white">{title}</h2><ul className="mt-4 space-y-3">{links.map(([label, href]) => <li key={href}><Link href={href} className="text-sm text-slate-400 transition hover:text-accent-300">{label}</Link></li>)}</ul></div>;
}
