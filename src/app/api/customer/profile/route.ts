import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyCustomer } from "@/lib/customerAuth";
import { customerProfileSchema } from "@/lib/validation";

export async function GET(req: NextRequest) {
  const session = verifyCustomer(req); if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const customer = await prisma.customer.findUnique({ where: { id: session.customerId }, select: { id: true, name: true, email: true, phone: true, emailVerifiedAt: true, createdAt: true, addresses: { orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }] }, settings: true } });
  if (!customer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ customer: { ...customer, emailVerified: Boolean(customer.emailVerifiedAt) } });
}

export async function PATCH(req: NextRequest) {
  const session = verifyCustomer(req); if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = customerProfileSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid profile details." }, { status: 400 });
  const customer = await prisma.customer.update({ where: { id: session.customerId }, data: { ...parsed.data, phone: parsed.data.phone || null }, select: { id: true, name: true, email: true, phone: true } });
  return NextResponse.json({ customer });
}

export async function PUT(req: NextRequest) {
  const session = verifyCustomer(req); if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => null);
  if (!body?.currentPassword || typeof body.newPassword !== "string" || body.newPassword.length < 12 || body.newPassword.length > 128) return NextResponse.json({ error: "Use a new password of at least 12 characters." }, { status: 400 });
  const customer = await prisma.customer.findUnique({ where: { id: session.customerId } });
  if (!customer || !(await bcrypt.compare(String(body.currentPassword), customer.password))) return NextResponse.json({ error: "Your current password is incorrect." }, { status: 400 });
  await prisma.customer.update({ where: { id: customer.id }, data: { password: await bcrypt.hash(body.newPassword, 12) } });
  return NextResponse.json({ success: true });
}
