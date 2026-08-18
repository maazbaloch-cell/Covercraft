import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isRateLimited } from "@/lib/rateLimit";
import { verifyCustomer } from "@/lib/customerAuth";
import { verifyCode } from "@/lib/verification";
import { otpConfirmSchema } from "@/lib/validation";

// Confirm the email-verification code for the signed-in customer.
export async function POST(req: NextRequest) {
  const session = verifyCustomer(req);
  if (!session) return NextResponse.json({ error: "Please sign in first." }, { status: 401 });
  if (isRateLimited(req, "verify-confirm", 10, 15 * 60_000)) return NextResponse.json({ error: "Too many attempts. Please try again later." }, { status: 429 });

  const parsed = otpConfirmSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Enter the 6-digit code." }, { status: 400 });

  const customer = await prisma.customer.findUnique({ where: { id: session.customerId } });
  if (!customer) return NextResponse.json({ error: "Account not found." }, { status: 404 });
  if (customer.emailVerifiedAt) return NextResponse.json({ ok: true, alreadyVerified: true });

  const result = await verifyCode(customer.email, "email_verify", parsed.data.code);
  if (result === "ok") {
    await prisma.customer.update({ where: { id: customer.id }, data: { emailVerifiedAt: new Date() } });
    return NextResponse.json({ ok: true });
  }
  const messages: Record<string, string> = {
    invalid: "That code is incorrect. Please check and try again.",
    expired: "That code has expired. Request a new one.",
    locked: "Too many incorrect attempts. Request a new code.",
  };
  return NextResponse.json({ error: messages[result] }, { status: 400 });
}
