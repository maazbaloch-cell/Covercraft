import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdmin } from "@/lib/adminAuth";

export async function GET(req: NextRequest) {
  const admin = verifyAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const start = searchParams.get("start");
  const end = searchParams.get("end");

  const where = {
    createdAt: {
      gte: start ? new Date(start) : new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      lte: end ? new Date(end) : new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0, 23, 59, 59),
    },
  };

  const orders = await prisma.order.findMany({
    where,
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });

  const totalOrders = orders.length;
  const paidOrders = orders.filter((order) => order.paymentStatus === "PAID");
  const totalRevenue = paidOrders.reduce((sum, order) => sum + order.totalAmount, 0);
  const totalProductsSold = orders.reduce((sum, order) => sum + order.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0);
  const pendingOrders = orders.filter((order) => order.status === "PENDING").length;
  const completedOrders = orders.filter((order) => order.status === "DELIVERED").length;
  const cancelledOrders = orders.filter((order) => order.status === "CANCELLED").length;

  return NextResponse.json({ totalOrders, totalRevenue, totalProductsSold, pendingOrders, completedOrders, cancelledOrders, orders });
}
