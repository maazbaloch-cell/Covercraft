import { NextRequest, NextResponse } from "next/server";
import { Prisma, SupportCategory } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/**
 * Public FAQ read endpoint for the Support Center.
 * Returns ONLY published FAQs. Supports optional `q` (partial, case-insensitive
 * match on question/answer) and `category` filtering. No auth required.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim().slice(0, 100);
  const categoryParam = (searchParams.get("category") || "").trim().toUpperCase();
  const category = (Object.values(SupportCategory) as string[]).includes(categoryParam)
    ? (categoryParam as SupportCategory)
    : undefined;

  const where: Prisma.FaqItemWhereInput = { isPublished: true };
  if (category) where.category = category;
  if (q) {
    where.OR = [
      { question: { contains: q, mode: "insensitive" } },
      { answer: { contains: q, mode: "insensitive" } },
    ];
  }

  try {
    const faqs = await prisma.faqItem.findMany({
      where,
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      select: { id: true, question: true, answer: true, category: true, slug: true },
      take: 100,
    });
    return NextResponse.json({ faqs });
  } catch {
    return NextResponse.json({ error: "Could not load help topics." }, { status: 500 });
  }
}
