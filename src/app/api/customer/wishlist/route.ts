import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyCustomer } from "@/lib/customerAuth";

export async function GET(req: NextRequest) {
  const session = verifyCustomer(req); if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const items = await prisma.wishlistItem.findMany({ where: { customerId: session.customerId, product: { deletedAt: null } }, include: { product: true }, orderBy: { createdAt: "desc" } });
  return NextResponse.json({ items, count: items.length });
}

export async function POST(req: NextRequest) {
  const session = verifyCustomer(req); if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); const productId = String((await req.json().catch(() => ({}))).productId || "");
  if (!productId) return NextResponse.json({ error: "Product is required." }, { status: 400 }); const product = await prisma.product.findFirst({ where: { id: productId, deletedAt: null, isActive: true } }); if (!product) return NextResponse.json({ error: "Product not found." }, { status: 404 });
  const item = await prisma.wishlistItem.upsert({ where: { customerId_productId: { customerId: session.customerId, productId } }, update: {}, create: { customerId: session.customerId, productId }, include: { product: true } }); return NextResponse.json({ item }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const session = verifyCustomer(req); if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); const productId = req.nextUrl.searchParams.get("productId"); if (!productId) return NextResponse.json({ error: "Product is required." }, { status: 400 }); await prisma.wishlistItem.deleteMany({ where: { customerId: session.customerId, productId } }); return NextResponse.json({ success: true });
}
