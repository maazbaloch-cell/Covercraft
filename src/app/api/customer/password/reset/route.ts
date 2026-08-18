import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isRateLimited } from "@/lib/rateLimit";
import { verifyCode } from "@/lib/verification";
import { passwordResetSchema } from "@/lib/validation";

// Complete a password reset using the emailed code.
export async function POST(req: NextRequest) {
  if (isRateLimited(req, "password-reset", 10, 15 * 60_000)) return NextResponse.json({ error: "Too many attempts. Please try again later." }, { status: 429 });
  const parsed = passwordResetSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid reset details." }, { status: 400 });

  const email = parsed.data.email.toLowerCase();
  const result = await verifyCode(email, "password_reset", parsed.data.code);
  if (result !== "ok") {
    const messages: Record<string, string> = {
      invalid: "That code is incorrect. Please check and try again.",
      expired: "That code has expired. Request a new one.",
      locked: "Too many incorrect attempts. Request a new code.",
    };
    return NextResponse.json({ error: messages[result] }, { status: 400 });
  }

  const customer = await prisma.customer.findUnique({ where: { email } });
  if (!customer) return NextResponse.json({ error: "Account not found." }, { status: 404 });

  // Proving control of the mailbox also verifies the email.
  await prisma.customer.update({
    where: { id: customer.id },
    data: { password: await bcrypt.hash(parsed.data.newPassword, 12), emailVerifiedAt: customer.emailVerifiedAt ?? new Date() },
  });
  return NextResponse.json({ ok: true });
}
