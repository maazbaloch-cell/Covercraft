import Link from "next/link";

export const metadata = {
  title: "Terms & Conditions · CoverCraft",
  description: "The terms that govern your use of CoverCraft and your purchases.",
};

export default function TermsPage() {
  return (
    <div className="util-dark min-h-screen">
      <div className="mx-auto max-w-3xl px-6 py-20">
        <p className="text-xs font-bold uppercase tracking-[0.28em] text-accent-400">Legal</p>
        <h1 className="mt-3 text-4xl font-black tracking-tight text-white sm:text-5xl">Terms &amp; Conditions</h1>
        <p className="mt-3 text-sm text-slate-400">Last updated: August 2026</p>

        <div className="mt-10 space-y-8 text-sm leading-7 text-slate-300">
          <section>
            <h2 className="text-lg font-bold text-white">Acceptance</h2>
            <p className="mt-2">
              By browsing CoverCraft and placing an order, you agree to these terms. If you do not agree, please
              do not use the service.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-bold text-white">Orders &amp; pricing</h2>
            <p className="mt-2">
              All prices are shown in Pakistani Rupees (Rs). We confirm your order after payment is completed
              through EasyPaisa. We may decline or cancel an order if an item is unavailable or a pricing error
              occurs, in which case any amount paid is refunded.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-bold text-white">Custom covers</h2>
            <p className="mt-2">
              Custom covers are made to the design you submit. Please review your artwork, text and chosen model
              carefully before checkout — because these items are produced specifically for you, they are eligible
              for return only if they arrive defective or damaged.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-bold text-white">Shipping &amp; returns</h2>
            <p className="mt-2">
              We deliver across Pakistan, typically within 2–4 business days. Returns are handled under our
              {" "}<Link href="/refund-policy" className="text-accent-300 hover:text-accent-400">Refund Policy</Link>.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-bold text-white">Acceptable use &amp; liability</h2>
            <p className="mt-2">
              You agree not to misuse the service or upload artwork you don&apos;t have the right to use. To the
              extent permitted by law, CoverCraft&apos;s liability for any order is limited to the amount you paid
              for that order.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-bold text-white">Contact</h2>
            <p className="mt-2">
              Questions about these terms? Reach us through the
              {" "}<Link href="/support" className="text-accent-300 hover:text-accent-400">Support Center</Link>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
