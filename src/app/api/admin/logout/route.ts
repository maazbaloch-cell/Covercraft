import { NextResponse } from "next/server";

// Logout only clears the cookie — it must succeed even for an expired/invalid
// admin session, so it deliberately performs no auth check.
export async function POST() {
  const response = NextResponse.json({ success: true });
  response.cookies.set("admin_token", "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/", maxAge: 0 });
  return response;
}
