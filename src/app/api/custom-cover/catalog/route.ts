import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const models = await prisma.mobileModel.findMany({
      where: { isActive: true },
      include: { templates: { where: { isActive: true }, orderBy: { createdAt: "asc" } } },
      orderBy: { brand: "asc" },
    });
    return NextResponse.json({ models });
  } catch (error) {
    console.error("Unable to load custom-cover catalog", error);
    return NextResponse.json({ models: [] });
  }
}
