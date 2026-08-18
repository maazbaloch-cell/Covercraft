import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { isRateLimited } from "@/lib/rateLimit";
import { isAuthConfigured, signToken } from "@/lib/jwt";

export async function POST(req: NextRequest) {
  if (isRateLimited(req, "admin-login", 5, 15 * 60_000)) return NextResponse.json({ error: "Too many login attempts. Please try again later." }, { status: 429 });
  if (!isAuthConfigured()) return NextResponse.json({ error: "Authentication is not configured." }, { status: 503 });
  const body = await req.json().catch(() => ({}));
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");

  if (!email || !password) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const admin = await prisma.admin.findUnique({ where: { email } });
  if (!admin || !(await bcrypt.compare(password, admin.password))) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const token = signToken({ adminId: admin.id, email: admin.email });

  const res = NextResponse.json({ success: true });
  res.cookies.set("admin_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });
  return res;
}
