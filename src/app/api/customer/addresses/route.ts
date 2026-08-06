import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyCustomer } from "@/lib/customerAuth";
import { addressSchema } from "@/lib/validation";

export async function POST(req: NextRequest) {
  const session = verifyCustomer(req); if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = addressSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid address." }, { status: 400 });
  const address = await prisma.$transaction(async (tx) => { if (parsed.data.isDefault) await tx.address.updateMany({ where: { customerId: session.customerId }, data: { isDefault: false } }); return tx.address.create({ data: { ...parsed.data, line2: parsed.data.line2 || null, customerId: session.customerId, isDefault: parsed.data.isDefault ?? (await tx.address.count({ where: { customerId: session.customerId } })) === 0 } }); });
  return NextResponse.json({ address }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const session = verifyCustomer(req); if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => null); const parsed = addressSchema.safeParse(body); if (!parsed.success || typeof body?.id !== "string") return NextResponse.json({ error: "Invalid address." }, { status: 400 });
  const address = await prisma.$transaction(async (tx) => { const existing = await tx.address.findFirst({ where: { id: body.id, customerId: session.customerId } }); if (!existing) throw new Error("ADDRESS_NOT_FOUND"); if (parsed.data.isDefault) await tx.address.updateMany({ where: { customerId: session.customerId }, data: { isDefault: false } }); return tx.address.update({ where: { id: body.id }, data: { ...parsed.data, line2: parsed.data.line2 || null } }); }).catch((error) => { if (error instanceof Error && error.message === "ADDRESS_NOT_FOUND") return null; throw error; });
  if (!address) return NextResponse.json({ error: "Address not found." }, { status: 404 });
  return NextResponse.json({ address });
}

export async function DELETE(req: NextRequest) {
  const session = verifyCustomer(req); if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); const id = req.nextUrl.searchParams.get("id"); if (!id) return NextResponse.json({ error: "Address id is required." }, { status: 400 });
  await prisma.address.deleteMany({ where: { id, customerId: session.customerId } }); return NextResponse.json({ success: true });
}
