import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdmin } from "@/lib/adminAuth";
import { notifyCustomerStatusUpdate } from "@/lib/whatsapp";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  if (!verifyAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const courier = body.courier === "TCS" || body.courier === "LEOPARDS" ? body.courier : null;
  const trackingNumber = typeof body.trackingNumber === "string" ? body.trackingNumber.trim() : "";
  if (!courier || !trackingNumber) return NextResponse.json({ error: "Select a courier and enter its consignment number." }, { status: 400 });

  const order = await prisma.order.update({
    where: { id: params.id },
    data: { courier, trackingNumber, status: "SHIPPED", trackingHistory: { create: { status: "SHIPPED", note: `${courier} consignment number assigned: ${trackingNumber}` } } },
  });
  await notifyCustomerStatusUpdate(order.customerPhone, order.orderNumber, "SHIPPED");
  return NextResponse.json({ order });
}
