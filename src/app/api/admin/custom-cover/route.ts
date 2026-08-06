import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdmin } from "@/lib/adminAuth";

function allowed(req: NextRequest) { return verifyAdmin(req) !== null; }

export async function GET(req: NextRequest) {
  if (!allowed(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const models = await prisma.mobileModel.findMany({ include: { templates: true }, orderBy: { brand: "asc" } });
  return NextResponse.json({ models });
}

export async function POST(req: NextRequest) {
  if (!allowed(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  if (body.type === "model" && body.name?.trim() && body.brand?.trim()) {
    const model = await prisma.mobileModel.create({ data: { name: body.name.trim(), brand: body.brand.trim() } });
    return NextResponse.json({ model }, { status: 201 });
  }
  if (body.type === "template" && body.name?.trim() && body.mobileModelId && Number.isInteger(body.price) && body.price > 0) {
    const template = await prisma.coverTemplate.create({ data: { name: body.name.trim(), price: body.price, imageUrl: body.imageUrl?.trim() || null, mobileModelId: body.mobileModelId } });
    return NextResponse.json({ template }, { status: 201 });
  }
  return NextResponse.json({ error: "Invalid catalog data" }, { status: 400 });
}

export async function PATCH(req: NextRequest) {
  if (!allowed(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  if (body.type === "template" && body.id && Number.isInteger(body.price) && body.price > 0) {
    return NextResponse.json({ template: await prisma.coverTemplate.update({ where: { id: body.id }, data: { price: body.price, imageUrl: body.imageUrl?.trim() || null, isActive: body.isActive !== false } }) });
  }
  return NextResponse.json({ error: "Invalid update" }, { status: 400 });
}

export async function DELETE(req: NextRequest) {
  if (!allowed(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const type = req.nextUrl.searchParams.get("type"); const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  if (type === "template") await prisma.coverTemplate.delete({ where: { id } });
  else if (type === "model") await prisma.mobileModel.delete({ where: { id } });
  else return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  return new NextResponse(null, { status: 204 });
}
