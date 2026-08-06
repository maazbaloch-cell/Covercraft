import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/adminAuth";

export async function POST(req: NextRequest) {
  const admin = verifyAdmin(req);
  const response = NextResponse.json({ success: true });
  response.cookies.set("admin_token", "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/", maxAge: 0 });
  return response;
}
