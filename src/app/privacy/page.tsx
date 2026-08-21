import Link from "next/link";

export const metadata = {
  title: "Privacy Policy · CoverCraft",
  description: "How CoverCraft collects, uses and protects your personal information.",
};

export default function PrivacyPage() {
  return (
    <div className="util-dark min-h-screen">
      <div className="mx-auto max-w-3xl px-6 py-20">
        <p className="text-xs font-bold uppercase tracking-[0.28em] text-accent-400">Legal</p>
        <h1 className="mt-3 text-4xl font-black tracking-tight text-white sm:text-5xl">Privacy Policy</h1>
        <p className="mt-3 text-sm text-slate-400">Last updated: August 2026</p>

        <div className="mt-10 space-y-8 text-sm leading-7 text-slate-300">
          <section>
            <h2 className="text-lg font-bold text-white">Information we collect</h2>
            <p className="mt-2">
              To fulfil your order we collect your name, email address, phone/WhatsApp number and delivery
              address. When you check out we email a one-time verification code to confirm it&apos;s really you.
              If you customize a cover, we store the design you create so it can be produced.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-bold text-white">How we use your information</h2>
            <p className="mt-2">
              Your details are used only to process and deliver your orders, send order confirmations and updates,
              provide support, and — if you opt in — send occasional product news. We do not sell your data.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-bold text-white">Sharing</h2>
            <p className="mt-2">
              We share information only with the partners needed to complete your order: our payment provider
              (EasyPaisa) to process payment, and delivery partners to ship your order. They receive only what
              they need for their part of the service.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-bold text-white">Data retention &amp; security</h2>
            <p className="mt-2">
              We keep order records for as long as needed to provide the service and meet legal obligations, and we
              protect your data with industry-standard security. No method of transmission is ever 100% secure, but
              we work hard to safeguard your information.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-bold text-white">Your choices</h2>
            <p className="mt-2">
              You can unsubscribe from newsletters at any time, and you can request access to or deletion of your
              personal data by contacting us through our
              {" "}<Link href="/support" className="text-accent-300 hover:text-accent-400">Support Center</Link>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
