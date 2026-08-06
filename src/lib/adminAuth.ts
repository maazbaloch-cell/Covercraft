import jwt from "jsonwebtoken";
import { NextRequest } from "next/server";

export function verifyAdmin(req: NextRequest): { adminId: string; email: string } | null {
  if (!process.env.JWT_SECRET) return null;
  const token = req.cookies.get("admin_token")?.value;
  if (!token) return null;
  try {
    return jwt.verify(token, process.env.JWT_SECRET!) as { adminId: string; email: string };
  } catch {
    return null;
  }
}
