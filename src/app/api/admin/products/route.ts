import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdmin } from "@/lib/adminAuth";
import { uploadToSupabase } from "@/lib/storage";

export async function GET(req: NextRequest) {
  const admin = verifyAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const products = await prisma.product.findMany({
    where: { deletedAt: null },
    orderBy: [{ createdAt: "desc" }],
  });

  return NextResponse.json({ products });
}

export async function POST(req: NextRequest) {
  const admin = verifyAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const price = Number(formData.get("price") || 0);
  const category = String(formData.get("category") || "").trim();
  const brand = String(formData.get("brand") || "").trim();
  const model = String(formData.get("model") || "").trim();
  const stock = Number(formData.get("stock") || 0);
  const isAvailable = String(formData.get("isAvailable") || "true") === "true";
  const file = formData.get("image") as File | null;

  if (!title || !Number.isInteger(price) || price < 1 || price > 10_000_000 || !brand || !model || !Number.isInteger(stock) || stock < 0 || stock > 100_000) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  let imageUrl = String(formData.get("imageUrl") || "").trim();
  if (file && file instanceof File) {
    try {
      imageUrl = await uploadToSupabase(file, "templates");
    } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Image upload failed" }, { status: 400 }); }
  }

  if (!imageUrl) return NextResponse.json({ error: "An image URL or validated image upload is required." }, { status: 400 });

  const product = await prisma.product.create({
    data: {
      title,
      description: description || null,
      imageUrl,
      price,
      category: category || "General",
      brand,
      model,
      stock: Number.isFinite(stock) ? stock : 0,
      isAvailable,
      isActive: true,
    },
  });

  return NextResponse.json({ product }, { status: 201 });
}
