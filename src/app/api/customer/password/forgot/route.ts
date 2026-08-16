import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isRateLimited } from "@/lib/rateLimit";
import { issueCode } from "@/lib/verification";
import { sendVerificationCodeEmail } from "@/lib/email";
import { emailOnlySchema } from "@/lib/validation";

// Start a password reset. Always responds with a generic success so the endpoint
// cannot be used to discover which emails have accounts.
export async function POST(req: NextRequest) {
  if (isRateLimited(req, "password-forgot", 5, 15 * 60_000)) return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
  const parsed = emailOnlySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });

  const email = parsed.data.email.toLowerCase();
  const customer = await prisma.customer.findUnique({ where: { email } });
  if (customer) {
    const issued = await issueCode(email, "password_reset");
    if (issued.ok) {
      try {
        await sendVerificationCodeEmail(email, issued.code, "password_reset");
      } catch (err) {
        console.error("Failed to send password reset code", err);
      }
    }
  }
  return NextResponse.json({ ok: true });
}
