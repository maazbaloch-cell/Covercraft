import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isRateLimited } from "@/lib/rateLimit";
import { customerLoginSchema } from "@/lib/validation";

export async function POST(req: NextRequest) {
  if (isRateLimited(req, "customer-login", 5, 15 * 60_000)) return NextResponse.json({ error: "Too many sign-in attempts. Please try again later." }, { status: 429 });
  if (!process.env.JWT_SECRET) return NextResponse.json({ error: "Authentication is not configured." }, { status: 503 });
  const parsed = customerLoginSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Enter a valid email address and password." }, { status: 400 });
  const customer = await prisma.customer.findUnique({ where: { email: parsed.data.email.toLowerCase() } });
  if (!customer || !(await bcrypt.compare(parsed.data.password, customer.password))) return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  const token = jwt.sign({ customerId: customer.id, email: customer.email, name: customer.name }, process.env.JWT_SECRET, { expiresIn: "7d" });
  const response = NextResponse.json({ customer: { id: customer.id, email: customer.email, name: customer.name } });
  response.cookies.set("customer_token", token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", maxAge: 60 * 60 * 24 * 7, path: "/" });
  return response;
}
