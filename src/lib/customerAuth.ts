import { NextRequest } from "next/server";
import { verifyToken } from "@/lib/jwt";

export type CustomerSession = { customerId: string; email: string; name: string };

export function verifyCustomer(req: NextRequest): CustomerSession | null {
  return verifyToken<CustomerSession>(req.cookies.get("customer_token")?.value);
}
