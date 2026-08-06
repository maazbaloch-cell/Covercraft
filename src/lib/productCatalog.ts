import { prisma } from "@/lib/prisma";
import { sampleProducts } from "@/data/products";

export async function ensureDefaultProducts() {
  const existingCount = await prisma.product.count({
    where: { deletedAt: null },
  });

  if (existingCount > 0) {
    return [];
  }

  return Promise.all(
    sampleProducts.map((product) =>
      prisma.product.create({
        data: {
          title: product.title,
          description: product.description,
          imageUrl: product.imageUrl || "/products/placeholder.svg",
          price: product.price,
          category: product.category || "General",
          brand: product.category?.split(" ")[0] || "General",
          model: product.category || "General",
          stock: 10,
          isAvailable: true,
          isActive: true,
        },
      })
    )
  );
}
