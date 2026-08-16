import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isRateLimited } from "@/lib/rateLimit";
import { verifyCustomer } from "@/lib/customerAuth";
import { issueCode } from "@/lib/verification";
import { sendVerificationCodeEmail } from "@/lib/email";

// Ask for (or resend) an email-verification code for the signed-in customer.
export async function POST(req: NextRequest) {
  const session = verifyCustomer(req);
  if (!session) return NextResponse.json({ error: "Please sign in first." }, { status: 401 });
  if (isRateLimited(req, "verify-request", 5, 15 * 60_000)) return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });

  const customer = await prisma.customer.findUnique({ where: { id: session.customerId } });
  if (!customer) return NextResponse.json({ error: "Account not found." }, { status: 404 });
  if (customer.emailVerifiedAt) return NextResponse.json({ ok: true, alreadyVerified: true });

  const issued = await issueCode(customer.email, "email_verify");
  if (!issued.ok) return NextResponse.json({ error: "Please wait before requesting another code.", retryAfterMs: issued.retryAfterMs }, { status: 429 });
  await sendVerificationCodeEmail(customer.email, issued.code, "email_verify");
  return NextResponse.json({ ok: true });
}
