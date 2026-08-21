import { NextRequest, NextResponse } from "next/server";
import { SupportStatus } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyAdmin } from "@/lib/adminAuth";

const patchSchema = z
  .object({
    status: z.nativeEnum(SupportStatus).optional(),
    adminNotes: z.string().trim().max(5000).nullable().optional(),
  })
  .refine((v) => v.status !== undefined || v.adminNotes !== undefined, {
    message: "Nothing to update",
  });

/**
 * Admin: update a support ticket's status and/or internal admin notes.
 * Protected: verifyAdmin. adminNotes are internal only and never exposed to
 * customers by any customer-facing endpoint.
 */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  if (!verifyAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid update." }, { status: 400 });

  try {
    const ticket = await prisma.supportTicket.update({
      where: { id: params.id },
      data: parsed.data,
    });
    return NextResponse.json({ ticket });
  } catch {
    return NextResponse.json({ error: "Ticket not found." }, { status: 404 });
  }
}
