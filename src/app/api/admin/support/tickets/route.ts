import { NextRequest, NextResponse } from "next/server";
import { Prisma, SupportStatus, SupportCategory } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { verifyAdmin } from "@/lib/adminAuth";

/**
 * Admin: list support tickets with optional status/category filters and a search
 * across ticket number, subject, customer name/email, and order number.
 * Protected: verifyAdmin (the edge middleware also 401s /api/admin/*).
 */
export async function GET(req: NextRequest) {
  if (!verifyAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const statusParam = (searchParams.get("status") || "").trim().toUpperCase();
  const categoryParam = (searchParams.get("category") || "").trim().toUpperCase();
  const q = (searchParams.get("q") || "").trim().slice(0, 100);

  const where: Prisma.SupportTicketWhereInput = {};
  if ((Object.values(SupportStatus) as string[]).includes(statusParam)) where.status = statusParam as SupportStatus;
  if ((Object.values(SupportCategory) as string[]).includes(categoryParam)) where.category = categoryParam as SupportCategory;
  if (q) {
    where.OR = [
      { ticketNumber: { contains: q, mode: "insensitive" } },
      { subject: { contains: q, mode: "insensitive" } },
      { name: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
      { orderNumber: { contains: q, mode: "insensitive" } },
    ];
  }

  const tickets = await prisma.supportTicket.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  return NextResponse.json({ tickets });
}
