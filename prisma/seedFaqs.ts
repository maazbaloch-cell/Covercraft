import { PrismaClient, SupportCategory } from "@prisma/client";

/**
 * seedFaqs — additive, idempotent Support Center knowledge base.
 *
 * SAFE TO RUN ON PRODUCTION. Like prisma/seedPhones.ts (and unlike the
 * destructive prisma/seed.ts), this script ONLY upserts FaqItem rows by their
 * unique `slug`. Re-running it refreshes the canonical question/answer/category
 * for these known slugs and never deletes anything, never touches any other
 * table, and never affects admin-authored FAQs with different slugs.
 *
 * Requires DATABASE_URL. Run with:  npm run seed:faqs
 */

const prisma = new PrismaClient();

type Seed = {
  slug: string;
  question: string;
  answer: string;
  category: SupportCategory;
  sortOrder: number;
};

const FAQS: Seed[] = [
  // Ordering
  { slug: "how-do-i-place-an-order", category: "ORDERING", sortOrder: 1, question: "How do I place an order?", answer: "Browse the shop or design a custom cover, add it to your cart, then go to checkout and confirm your details. You'll receive an order number and a confirmation once payment is complete." },
  { slug: "can-i-change-or-cancel-my-order", category: "ORDERING", sortOrder: 2, question: "Can I change or cancel my order after placing it?", answer: "If your order hasn't entered production yet, contact support with your order number and we'll do our best to update or cancel it. Custom covers move into production quickly, so reach out as soon as possible." },
  { slug: "do-i-need-an-account-to-order", category: "ORDERING", sortOrder: 3, question: "Do I need an account to order?", answer: "You can check out as a guest, but creating an account lets you track orders, save addresses, and view your full order history from the Account page." },

  // Shipping & delivery
  { slug: "how-long-does-delivery-take", category: "SHIPPING", sortOrder: 1, question: "How long does delivery take?", answer: "Standard covers ship within 1–2 business days. Custom-printed covers are made to order and typically dispatch within 2–4 business days, then travel via our courier partners to your address." },
  { slug: "how-much-is-shipping", category: "SHIPPING", sortOrder: 2, question: "How much does shipping cost?", answer: "Shipping is calculated at checkout based on your delivery location. Any active free-shipping thresholds or promotions are applied automatically before you pay." },
  { slug: "which-areas-do-you-deliver-to", category: "SHIPPING", sortOrder: 3, question: "Which areas do you deliver to?", answer: "We deliver nationwide through our courier partners. Enter your city and address at checkout to confirm availability for your location." },

  // Tracking
  { slug: "how-do-i-track-my-order", category: "TRACKING", sortOrder: 1, question: "How do I track my order?", answer: "Use the Track Order page and enter your order number (it starts with your confirmation email). You'll see the latest status and courier tracking updates as your cover moves toward you." },
  { slug: "what-do-the-order-statuses-mean", category: "TRACKING", sortOrder: 2, question: "What do the order statuses mean?", answer: "Pending means we've received your order, Confirmed means payment cleared, Processing/Shipped means it's being made and dispatched, Out for Delivery means it's on the way today, and Delivered means it reached you." },

  // Customization
  { slug: "how-does-custom-cover-design-work", category: "CUSTOMIZATION", sortOrder: 1, question: "How does designing a custom cover work?", answer: "Open Customize Your Cover, pick your exact phone model, then add photos, text, colours, and effects on the live preview. The preview reshapes to your chosen model so what you see is what gets printed." },
  { slug: "what-image-quality-should-i-upload", category: "CUSTOMIZATION", sortOrder: 2, question: "What image quality should I upload for the best print?", answer: "Use the highest-resolution image you have — ideally 1000px or larger on the shortest side. Sharp, well-lit photos print best; very small or blurry images may look soft on the finished cover." },
  { slug: "can-i-choose-my-exact-phone-model", category: "CUSTOMIZATION", sortOrder: 3, question: "Can I choose my exact phone model?", answer: "Yes. Select your specific model in the customizer and the cover preview adjusts its shape and camera cutout to match, so the printed cover fits your device precisely." },

  // Payments
  { slug: "what-payment-methods-do-you-accept", category: "PAYMENTS", sortOrder: 1, question: "What payment methods do you accept?", answer: "Accepted payment methods are shown at checkout. Your order is confirmed as soon as payment is successfully received, and you'll get an email and WhatsApp confirmation." },
  { slug: "is-my-payment-secure", category: "PAYMENTS", sortOrder: 2, question: "Is my payment information secure?", answer: "Payments are processed securely and we never store your full card details on our servers. If a payment fails, no order is created and you can safely try again." },

  // Returns & refunds
  { slug: "what-is-your-return-policy", category: "RETURNS", sortOrder: 1, question: "What is your return and refund policy?", answer: "Standard covers can be returned if unused and in original condition within the return window. Because custom-printed covers are made uniquely for you, they're only eligible for replacement or refund if they arrive damaged or defective." },
  { slug: "my-cover-arrived-damaged", category: "RETURNS", sortOrder: 2, question: "My cover arrived damaged — what should I do?", answer: "We're sorry about that. Contact support with your order number and a photo of the issue, and we'll arrange a replacement or refund for the damaged item as quickly as possible." },
];

async function main() {
  let created = 0;
  for (const f of FAQS) {
    const existing = await prisma.faqItem.findUnique({ where: { slug: f.slug }, select: { id: true } });
    await prisma.faqItem.upsert({
      where: { slug: f.slug },
      // Keep canonical content fresh for known slugs; never unpublish (admins may
      // toggle visibility themselves, so we don't override isPublished on update).
      update: { question: f.question, answer: f.answer, category: f.category, sortOrder: f.sortOrder },
      create: { slug: f.slug, question: f.question, answer: f.answer, category: f.category, sortOrder: f.sortOrder, isPublished: true },
    });
    if (!existing) created++;
  }
  // eslint-disable-next-line no-console
  console.log(`seedFaqs: ${FAQS.length} FAQs upserted (${created} newly created).`);
}

main()
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
