import { NextRequest, NextResponse } from "next/server";
import { isRateLimited } from "@/lib/rateLimit";
import { issueCode } from "@/lib/verification";
import { sendVerificationCodeEmail } from "@/lib/email";
import { emailOnlySchema } from "@/lib/validation";

// Send a checkout confirmation code to the buyer's email (guest or signed-in).
export async function POST(req: NextRequest) {
  if (isRateLimited(req, "checkout-otp-request", 6, 15 * 60_000)) return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
  const parsed = emailOnlySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });

  const email = parsed.data.email.toLowerCase();
  const issued = await issueCode(email, "checkout");
  if (!issued.ok) return NextResponse.json({ error: "Please wait before requesting another code.", retryAfterMs: issued.retryAfterMs }, { status: 429 });
  await sendVerificationCodeEmail(email, issued.code, "checkout");
  return NextResponse.json({ ok: true });
}
