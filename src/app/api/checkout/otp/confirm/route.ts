import { NextRequest, NextResponse } from "next/server";
import { isRateLimited } from "@/lib/rateLimit";
import { verifyCode } from "@/lib/verification";
import { checkoutOtpConfirmSchema } from "@/lib/validation";
import { CHECKOUT_TICKET_COOKIE, CHECKOUT_TICKET_MAX_AGE, issueCheckoutTicket } from "@/lib/checkoutTicket";

// Confirm the checkout OTP and mint a short-lived ticket the checkout route requires.
export async function POST(req: NextRequest) {
  if (isRateLimited(req, "checkout-otp-confirm", 10, 15 * 60_000)) return NextResponse.json({ error: "Too many attempts. Please try again later." }, { status: 429 });
  const parsed = checkoutOtpConfirmSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Enter the 6-digit code." }, { status: 400 });

  const email = parsed.data.email.toLowerCase();
  const result = await verifyCode(email, "checkout", parsed.data.code);
  if (result !== "ok") {
    const messages: Record<string, string> = {
      invalid: "That code is incorrect. Please check and try again.",
      expired: "That code has expired. Request a new one.",
      locked: "Too many incorrect attempts. Request a new code.",
    };
    return NextResponse.json({ error: messages[result] }, { status: 400 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(CHECKOUT_TICKET_COOKIE, issueCheckoutTicket(email), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: CHECKOUT_TICKET_MAX_AGE,
    path: "/",
  });
  return response;
}
