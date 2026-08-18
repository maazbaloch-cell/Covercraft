import { NextRequest } from "next/server";
import { signToken, verifyToken } from "@/lib/jwt";

export const CHECKOUT_TICKET_COOKIE = "checkout_ticket";
export const CHECKOUT_TICKET_MAX_AGE = 20 * 60; // seconds
const SCOPE = "checkout";

type CheckoutTicket = { scope: string; email: string };

// A short-lived signed proof that the buyer confirmed an emailed OTP for this address.
export function issueCheckoutTicket(email: string): string {
  return signToken({ scope: SCOPE, email: email.toLowerCase() }, "20m");
}

export function hasValidCheckoutTicket(req: NextRequest, email: string): boolean {
  const ticket = verifyToken<CheckoutTicket>(req.cookies.get(CHECKOUT_TICKET_COOKIE)?.value);
  return Boolean(ticket && ticket.scope === SCOPE && ticket.email === email.toLowerCase());
}
