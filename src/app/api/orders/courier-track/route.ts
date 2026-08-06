import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Courier, getCourierTracking } from "@/lib/courierTracking";

export async function GET(req: NextRequest) {
  const orderNumber = req.nextUrl.searchParams.get("order")?.trim();
  if (!orderNumber) return NextResponse.json({ error: "Order number required" }, { status: 400 });

  const order = await prisma.order.findUnique({ where: { orderNumber }, select: { courier: true, trackingNumber: true } });
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  if (order.courier !== "TCS" && order.courier !== "LEOPARDS" || !order.trackingNumber) {
    return NextResponse.json({ error: "A courier tracking number has not been assigned to this order yet." }, { status: 404 });
  }

  const tracking = await getCourierTracking(order.courier as Courier, order.trackingNumber);
  if (tracking.configured) {
    await prisma.order.update({ where: { orderNumber }, data: { courierLastSyncedAt: new Date() } });
  }
  return NextResponse.json(tracking);
}
