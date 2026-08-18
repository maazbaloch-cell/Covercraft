import { NextRequest } from "next/server";
import { verifyToken } from "@/lib/jwt";

export function verifyAdmin(req: NextRequest): { adminId: string; email: string } | null {
  return verifyToken<{ adminId: string; email: string }>(req.cookies.get("admin_token")?.value);
}
