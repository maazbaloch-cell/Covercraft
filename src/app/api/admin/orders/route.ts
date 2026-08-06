import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdmin } from "@/lib/adminAuth";

export async function GET(req: NextRequest) {
  const admin = verifyAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      items: { include: { product: true, customDesign: true } },
      trackingHistory: { orderBy: { createdAt: "asc" } },
      payment: true,
    },
  });

  const ordersWithMeta = orders.map((order) => ({
    ...order,
    paymentMethod: order.payment?.method ?? "EasyPaisa",
    paymentReference: order.payment?.transactionId ?? null,
  }));

  const totalSales = ordersWithMeta
    .filter((order) => order.paymentStatus === "PAID")
    .reduce((sum, order) => sum + order.totalAmount, 0);

  return NextResponse.json({ orders: ordersWithMeta, totalSales, totalOrders: ordersWithMeta.length });
}
