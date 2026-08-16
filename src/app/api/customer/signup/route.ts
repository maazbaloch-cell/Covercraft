import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isRateLimited } from "@/lib/rateLimit";
import { customerSignupSchema } from "@/lib/validation";
import { isAuthConfigured, signToken } from "@/lib/jwt";
import { issueCode } from "@/lib/verification";
import { sendVerificationCodeEmail } from "@/lib/email";

function sessionResponse(customer: { id: string; email: string; name: string }, status = 200) {
  const token = signToken({ customerId: customer.id, email: customer.email, name: customer.name });
  const response = NextResponse.json({ customer: { id: customer.id, email: customer.email, name: customer.name, emailVerified: false } }, { status });
  response.cookies.set("customer_token", token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", maxAge: 60 * 60 * 24 * 7, path: "/" });
  return response;
}

export async function POST(req: NextRequest) {
  if (isRateLimited(req, "customer-signup", 5, 15 * 60_000)) return NextResponse.json({ error: "Too many sign-up attempts. Please try again later." }, { status: 429 });
  if (!isAuthConfigured()) return NextResponse.json({ error: "Authentication is not configured." }, { status: 503 });
  const parsed = customerSignupSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid account details." }, { status: 400 });
  const { name, password } = parsed.data;
  const email = parsed.data.email.toLowerCase();
  try {
    const customer = await prisma.customer.create({ data: { name, email, password: await bcrypt.hash(password, 12) } });
    // Kick off email verification. Delivery failures must not block account creation.
    try {
      const issued = await issueCode(email, "email_verify");
      if (issued.ok) await sendVerificationCodeEmail(email, issued.code, "email_verify");
    } catch (err) {
      console.error("Failed to send verification code on signup", err);
    }
    return sessionResponse(customer, 201);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return NextResponse.json({ error: "An account with this email already exists. Please sign in." }, { status: 409 });
    console.error("Customer signup failed", error);
    return NextResponse.json({ error: "Unable to create your account right now." }, { status: 500 });
  }
}
