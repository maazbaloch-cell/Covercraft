import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyCustomer } from "@/lib/customerAuth";
import { isRateLimited } from "@/lib/rateLimit";

// Compare phone numbers by their last 10 significant digits so "+92 300…", "0300…" and
// "300…" all match, while still requiring a real number (not an empty/short string).
function phoneMatches(a: string, b: string) {
  const da = a.replace(/\D/g, ""), db = b.replace(/\D/g, "");
  return da.length >= 7 && db.length >= 7 && da.slice(-10) === db.slice(-10);
}

// GET /api/orders/track?order=MBC-12345&contact=<email or phone on the order>
// An order may be viewed only by its owner: either the signed-in customer who placed it,
// or a caller who proves ownership with the email/phone used on the order. This prevents
// pulling a stranger's order by knowing only its (public-looking) order number.
export async function GET(req: NextRequest) {
  if (isRateLimited(req, "track", 30, 10 * 60_000)) {
    return NextResponse.json({ error: "Too many tracking requests. Please try again shortly." }, { status: 429 });
  }

  const orderNumber = req.nextUrl.searchParams.get("order")?.trim();
  const contact = req.nextUrl.searchParams.get("contact")?.trim().slice(0, 200) || "";
  if (!orderNumber) {
    return NextResponse.json({ error: "Order number required" }, { status: 400 });
  }

  const order = await prisma.order.findUnique({
    where: { orderNumber },
    include: {
      trackingHistory: { orderBy: { createdAt: "asc" } },
      items: { include: { product: true, customDesign: true } },
    },
  });

  const session = verifyCustomer(req);
  const ownedBySession = Boolean(order && session?.customerId && order.customerId === session.customerId);
  const matchesContact = Boolean(
    order && contact && (
      contact.toLowerCase() === order.customerEmail.toLowerCase() ||
      phoneMatches(contact, order.customerPhone)
    )
  );

  // Uniform response whether the order is missing or the caller isn't its owner, so the
  // endpoint never reveals that a given order number exists to someone who can't prove ownership.
  if (!order || (!ownedBySession && !matchesContact)) {
    return NextResponse.json(
      { error: "We couldn't find an order matching those details. Check the order number and the email or phone used on the order." },
      { status: 404 },
    );
  }

  // Only return what's needed for the tracking page (no full email/phone exposed).
  return NextResponse.json({
    orderNumber: order.orderNumber,
    status: order.status,
    paymentStatus: order.paymentStatus,
    createdAt: order.createdAt,
    trackingHistory: order.trackingHistory,
    items: order.items.map((i) => ({ title: i.product?.title ?? `Custom ${i.customDesign?.mobileModel ?? "mobile"} cover`, quantity: i.quantity })),
    totalAmount: order.totalAmount,
  });
}
