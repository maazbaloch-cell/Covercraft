import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/orders/track?order=MBC-12345
export async function GET(req: NextRequest) {
  const orderNumber = req.nextUrl.searchParams.get("order");
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

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  // Only return what's needed for a public tracking page (no full email/phone exposed)
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
