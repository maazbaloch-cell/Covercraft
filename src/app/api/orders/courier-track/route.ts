import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Courier, getCourierTracking } from "@/lib/courierTracking";
import { verifyCustomer } from "@/lib/customerAuth";
import { isRateLimited } from "@/lib/rateLimit";

function phoneMatches(a: string, b: string) {
  const da = a.replace(/\D/g, ""), db = b.replace(/\D/g, "");
  return da.length >= 7 && db.length >= 7 && da.slice(-10) === db.slice(-10);
}

// GET /api/orders/courier-track?order=MBC-12345&contact=<email or phone on the order>
// Same owner-only gate as /api/orders/track — a courier scan is private order data.
export async function GET(req: NextRequest) {
  if (isRateLimited(req, "courier-track", 30, 10 * 60_000)) {
    return NextResponse.json({ error: "Too many tracking requests. Please try again shortly." }, { status: 429 });
  }

  const orderNumber = req.nextUrl.searchParams.get("order")?.trim();
  const contact = req.nextUrl.searchParams.get("contact")?.trim().slice(0, 200) || "";
  if (!orderNumber) return NextResponse.json({ error: "Order number required" }, { status: 400 });

  const order = await prisma.order.findUnique({
    where: { orderNumber },
    select: { courier: true, trackingNumber: true, customerId: true, customerEmail: true, customerPhone: true },
  });

  const session = verifyCustomer(req);
  const ownedBySession = Boolean(order && session?.customerId && order.customerId === session.customerId);
  const matchesContact = Boolean(
    order && contact && (
      contact.toLowerCase() === order.customerEmail.toLowerCase() ||
      phoneMatches(contact, order.customerPhone)
    )
  );

  if (!order || (!ownedBySession && !matchesContact)) {
    return NextResponse.json(
      { error: "We couldn't find an order matching those details. Check the order number and the email or phone used on the order." },
      { status: 404 },
    );
  }

  if (order.courier !== "TCS" && order.courier !== "LEOPARDS" || !order.trackingNumber) {
    return NextResponse.json({ error: "A courier tracking number has not been assigned to this order yet." }, { status: 404 });
  }

  const tracking = await getCourierTracking(order.courier as Courier, order.trackingNumber);
  if (tracking.configured) {
    await prisma.order.update({ where: { orderNumber }, data: { courierLastSyncedAt: new Date() } });
  }
  return NextResponse.json(tracking);
}
