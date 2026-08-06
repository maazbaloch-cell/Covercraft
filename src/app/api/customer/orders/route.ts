import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyCustomer } from "@/lib/customerAuth";

export async function GET(req: NextRequest) { const session = verifyCustomer(req); if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); const orders = await prisma.order.findMany({ where: { customerId: session.customerId }, include: { items: { include: { product: true, customDesign: true } }, payment: true, trackingHistory: { orderBy: { createdAt: "asc" } } }, orderBy: { createdAt: "desc" } }); return NextResponse.json({ orders }); }
