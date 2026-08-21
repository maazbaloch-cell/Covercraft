import { NextRequest, NextResponse } from "next/server";
import { SupportCategory } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyCustomer } from "@/lib/customerAuth";
import { isRateLimited } from "@/lib/rateLimit";
import { sendSupportTicketNotification } from "@/lib/email";

const ticketSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(150),
  orderNumber: z.string().trim().max(50).optional().or(z.literal("")),
  category: z.nativeEnum(SupportCategory).default(SupportCategory.OTHER),
  subject: z.string().trim().min(3).max(150),
  message: z.string().trim().min(10).max(5000),
});

// Short, human-readable, collision-resistant ticket reference.
function makeTicketNumber() {
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `SUP-${Date.now().toString(36).toUpperCase()}-${rand}`;
}

/**
 * Create a support ticket.
 * - Server-side zod validation (rejects malformed input, bad email, short message).
 * - Rate limited per IP.
 * - When the requester is authenticated, the ticket is associated with their
 *   Customer via the SESSION (never a client-supplied id).
 * - Order ownership: a signed-in customer may not file a ticket referencing an
 *   order that belongs to a DIFFERENT customer.
 */
export async function POST(req: NextRequest) {
  if (isRateLimited(req, "support-ticket", 5)) {
    return NextResponse.json({ error: "Too many requests. Please try again in a minute." }, { status: 429 });
  }

  const parsed = ticketSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Please check the form and try again." }, { status: 400 });
  }
  const { name, email, category, subject, message } = parsed.data;
  const orderNumber = parsed.data.orderNumber ? parsed.data.orderNumber : null;

  const session = verifyCustomer(req);
  const customerId = session?.customerId ?? null;

  // Never let a signed-in user attach a ticket to someone else's order.
  if (session && orderNumber) {
    const order = await prisma.order.findUnique({
      where: { orderNumber },
      select: { customerId: true },
    });
    if (order && order.customerId && order.customerId !== session.customerId) {
      return NextResponse.json({ error: "That order number is not associated with your account." }, { status: 403 });
    }
  }

  let ticket;
  try {
    // Retry once on the (astronomically unlikely) ticketNumber collision.
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        ticket = await prisma.supportTicket.create({
          data: { ticketNumber: makeTicketNumber(), name, email, orderNumber, category, subject, message, customerId },
          select: { ticketNumber: true },
        });
        break;
      } catch (e: unknown) {
        const code = (e as { code?: string })?.code;
        if (code === "P2002" && attempt === 0) continue;
        throw e;
      }
    }
  } catch {
    return NextResponse.json({ error: "We couldn't submit your request. Please try again." }, { status: 500 });
  }
  if (!ticket) {
    return NextResponse.json({ error: "We couldn't submit your request. Please try again." }, { status: 500 });
  }

  // Notify admin via the existing email system; a mail failure must not fail the ticket.
  try {
    await sendSupportTicketNotification({
      ticketNumber: ticket.ticketNumber,
      name,
      email,
      category,
      subject,
      message,
      orderNumber,
      authenticated: Boolean(session),
    });
  } catch {
    /* non-fatal */
  }

  return NextResponse.json({ success: true, ticketNumber: ticket.ticketNumber });
}
