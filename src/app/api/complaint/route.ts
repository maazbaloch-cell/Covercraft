import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { notifyAdminComplaint } from "@/lib/whatsapp";
import { isRateLimited } from "@/lib/rateLimit";
import { z } from "zod";

const complaintSchema = z.object({ name: z.string().trim().min(1).max(100), phone: z.string().trim().regex(/^\+?[0-9\s()-]{7,20}$/), orderNumber: z.string().trim().max(50).optional(), message: z.string().trim().min(1).max(2_000) });

export async function POST(req: NextRequest) {
  if (isRateLimited(req, "complaint", 5)) return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
  const parsed = complaintSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid complaint details" }, { status: 400 });
  const { name, phone, orderNumber, message } = parsed.data;

  const complaint = await prisma.complaint.create({
    data: { name, phone, orderNumber, message, channel: "web" },
  });

  await notifyAdminComplaint(phone, `[Web form] ${message}`);

  return NextResponse.json({ success: true, complaint });
}
