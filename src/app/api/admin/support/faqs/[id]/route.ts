import { NextRequest, NextResponse } from "next/server";
import { SupportCategory } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyAdmin } from "@/lib/adminAuth";

const patchSchema = z
  .object({
    question: z.string().trim().min(3).max(300).optional(),
    answer: z.string().trim().min(3).max(5000).optional(),
    category: z.nativeEnum(SupportCategory).optional(),
    sortOrder: z.number().int().min(0).max(9999).optional(),
    isPublished: z.boolean().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: "Nothing to update" });

/** Admin: update a FAQ (including publish/unpublish via isPublished). Protected. */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  if (!verifyAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid FAQ update." }, { status: 400 });

  try {
    const faq = await prisma.faqItem.update({ where: { id: params.id }, data: parsed.data });
    return NextResponse.json({ faq });
  } catch {
    return NextResponse.json({ error: "FAQ not found." }, { status: 404 });
  }
}

/** Admin: delete a FAQ. Protected. */
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  if (!verifyAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    await prisma.faqItem.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "FAQ not found." }, { status: 404 });
  }
}
