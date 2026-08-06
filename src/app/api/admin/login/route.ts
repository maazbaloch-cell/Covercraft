import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { isRateLimited } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
  if (isRateLimited(req, "admin-login", 5, 15 * 60_000)) return NextResponse.json({ error: "Too many login attempts. Please try again later." }, { status: 429 });
  const body = await req.json().catch(() => ({}));
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");

  if (!email || !password || !process.env.JWT_SECRET) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const admin = await prisma.admin.findUnique({ where: { email } });
  if (!admin || !(await bcrypt.compare(password, admin.password))) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const token = jwt.sign({ adminId: admin.id, email: admin.email }, process.env.JWT_SECRET!, {
    expiresIn: "7d",
  });

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
