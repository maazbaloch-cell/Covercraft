import jwt from "jsonwebtoken";
import { NextRequest } from "next/server";

export type CustomerSession = { customerId: string; email: string; name: string };

export function verifyCustomer(req: NextRequest): CustomerSession | null {
  const token = req.cookies.get("customer_token")?.value;
  if (!token || !process.env.JWT_SECRET) return null;
  try {
    return jwt.verify(token, process.env.JWT_SECRET) as CustomerSession;
  } catch {
    return null;
  }
}
