import { NextRequest, NextResponse } from "next/server";
import { SupportCategory } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyAdmin } from "@/lib/adminAuth";

/** Admin: list ALL FAQs (published and unpublished). Protected. */
export async function GET(req: NextRequest) {
  if (!verifyAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const faqs = await prisma.faqItem.findMany({
    orderBy: [{ category: "asc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
  });
  return NextResponse.json({ faqs });
}

const createSchema = z.object({
  question: z.string().trim().min(3).max(300),
  answer: z.string().trim().min(3).max(5000),
  category: z.nativeEnum(SupportCategory).default(SupportCategory.OTHER),
  sortOrder: z.number().int().min(0).max(9999).optional(),
  isPublished: z.boolean().optional(),
  slug: z.string().trim().max(120).optional(),
});

function slugify(input: string) {
  return (
    input
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "faq"
  );
}

/** Admin: create a FAQ. Protected. Slug is auto-derived and de-duplicated. */
export async function POST(req: NextRequest) {
  if (!verifyAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid FAQ details." }, { status: 400 });
  const { question, answer, category } = parsed.data;
  const base = parsed.data.slug ? slugify(parsed.data.slug) : slugify(question);

  for (let attempt = 0; attempt < 3; attempt++) {
    const slug = attempt === 0 ? base : `${base}-${Math.random().toString(36).slice(2, 6)}`;
    try {
      const faq = await prisma.faqItem.create({
        data: {
          question,
          answer,
          category,
          slug,
          sortOrder: parsed.data.sortOrder ?? 0,
          isPublished: parsed.data.isPublished ?? true,
        },
      });
      return NextResponse.json({ faq });
    } catch (e: unknown) {
      if ((e as { code?: string })?.code === "P2002") continue;
      return NextResponse.json({ error: "Could not create FAQ." }, { status: 500 });
    }
  }
  return NextResponse.json({ error: "Could not create a unique FAQ slug." }, { status: 409 });
}
