import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyCustomer } from "@/lib/customerAuth";
import { customerSettingsSchema } from "@/lib/validation";

export async function GET(req: NextRequest) { const session = verifyCustomer(req); if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); const settings = await prisma.customerSetting.upsert({ where: { customerId: session.customerId }, update: {}, create: { customerId: session.customerId } }); return NextResponse.json({ settings }); }
export async function PATCH(req: NextRequest) { const session = verifyCustomer(req); if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); const parsed = customerSettingsSchema.safeParse(await req.json().catch(() => null)); if (!parsed.success) return NextResponse.json({ error: "Invalid settings." }, { status: 400 }); const settings = await prisma.customerSetting.upsert({ where: { customerId: session.customerId }, update: parsed.data, create: { customerId: session.customerId, ...parsed.data } }); return NextResponse.json({ settings }); }
