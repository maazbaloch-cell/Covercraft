import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isRateLimited } from "@/lib/rateLimit";
import { newsletterSchema } from "@/lib/validation";

export async function POST(req: NextRequest) {
  if (isRateLimited(req, "newsletter", 5, 60_000)) return NextResponse.json({ error: "Please wait before trying again." }, { status: 429 }); const parsed = newsletterSchema.safeParse(await req.json().catch(() => null)); if (!parsed.success) return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  const email = parsed.data.email.toLowerCase();
  try { const subscriber = await prisma.newsletterSubscriber.upsert({ where: { email }, update: { active: true }, create: { email } }); return NextResponse.json({ subscriber: { email: subscriber.email } }, { status: 201 }); } catch (error) { console.error("Newsletter subscription failed", error); return NextResponse.json({ error: "Unable to subscribe right now." }, { status: 500 }); }
}
