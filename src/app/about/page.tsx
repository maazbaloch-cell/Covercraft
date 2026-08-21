import Link from "next/link";

export const metadata = {
  title: "About Us · CoverCraft",
  description: "The story behind CoverCraft — premium mobile covers designed around your device.",
};

export default function AboutPage() {
  return (
    <div className="util-dark min-h-screen">
      <div className="mx-auto max-w-3xl px-6 py-20">
        <p className="text-xs font-bold uppercase tracking-[0.28em] text-accent-400">Our Story</p>
        <h1 className="mt-3 text-4xl font-black tracking-tight text-white sm:text-5xl">About CoverCraft</h1>
        <p className="mt-5 text-base leading-8 text-slate-300">
          CoverCraft began with a simple idea: your phone goes everywhere with you, so its cover should feel
          like it was made for you — not pulled off a generic shelf. We design premium mobile covers around
          the exact shape of your device, then let you make them unmistakably yours.
        </p>

        <div className="mt-12 space-y-8 text-sm leading-7 text-slate-300">
          <section>
            <h2 className="text-lg font-bold text-white">What we make</h2>
            <p className="mt-2">
              Precision-fit covers with a raised camera lip, shock-absorbing corners and finishes chosen to feel
              considered the moment you pick them up. Every port, button and lens sits exactly where it belongs.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-bold text-white">Design it your way</h2>
            <p className="mt-2">
              Our customization studio lets you add your own artwork, text and colours, then preview the result on
              a true-to-life model of your phone before it&apos;s made. What you design is what we craft.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-bold text-white">Our promise</h2>
            <p className="mt-2">
              Top-grade materials, secure checkout and fast delivery across Pakistan. If something isn&apos;t right,
              our <Link href="/support" className="text-accent-300 hover:text-accent-400">Support Center</Link> is here to help.
            </p>
          </section>
        </div>

        <div className="mt-12 flex flex-wrap gap-4">
          <Link href="/shop" className="rounded-full bg-brand px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-brand-accent">Browse covers</Link>
          <Link href="/customize-cover" className="rounded-full border border-white/15 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-white/5">Customize your cover</Link>
        </div>
      </div>
    </div>
  );
}
