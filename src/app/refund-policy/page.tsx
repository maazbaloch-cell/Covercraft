import Link from "next/link";

export const metadata = {
  title: "Refund Policy · CoverCraft",
  description: "How returns, exchanges and refunds work at CoverCraft.",
};

export default function RefundPolicyPage() {
  return (
    <div className="util-dark min-h-screen">
      <div className="mx-auto max-w-3xl px-6 py-20">
        <p className="text-xs font-bold uppercase tracking-[0.28em] text-accent-400">Legal</p>
        <h1 className="mt-3 text-4xl font-black tracking-tight text-white sm:text-5xl">Refund Policy</h1>
        <p className="mt-3 text-sm text-slate-400">Last updated: August 2026</p>

        <div className="mt-10 space-y-8 text-sm leading-7 text-slate-300">
          <section>
            <h2 className="text-lg font-bold text-white">7-day return window</h2>
            <p className="mt-2">
              If you&apos;re not happy with a standard cover, you can request a return within 7 days of delivery.
              Items must be unused, in their original condition and packaging.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-bold text-white">Custom covers</h2>
            <p className="mt-2">
              Because custom covers are made specifically to your design, they can&apos;t be returned for a change
              of mind. If a custom cover arrives defective, damaged or not matching your approved design, we&apos;ll
              replace it or refund it.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-bold text-white">Damaged or wrong items</h2>
            <p className="mt-2">
              If your order arrives damaged or you received the wrong item, contact us within 48 hours of delivery
              with a photo and we&apos;ll make it right at no cost to you.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-bold text-white">How to request a return</h2>
            <p className="mt-2">
              Start a request through our
              {" "}<Link href="/support" className="text-accent-300 hover:text-accent-400">Support Center</Link>
              {" "}or by <Link href="/complaint" className="text-accent-300 hover:text-accent-400">filing a complaint</Link>
              {" "}with your order details. Once your return is approved and received, refunds are issued to your
              original EasyPaisa payment method, typically within 5–7 business days.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
