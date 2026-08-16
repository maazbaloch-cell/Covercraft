import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import ShopCatalog, { CatalogProduct } from "@/components/ShopCatalog";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Shop all covers — CoverCraft",
  description: "Browse the full CoverCraft collection. Search, filter and find the mobile back cover that fits your phone and your style.",
};

export default async function ShopPage() {
  let products: CatalogProduct[] = [];

  try {
    products = await prisma.product.findMany({
      where: { deletedAt: null, isActive: true },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        description: true,
        imageUrl: true,
        price: true,
        category: true,
        brand: true,
        model: true,
        stock: true,
        isAvailable: true,
        createdAt: true,
      },
    });
  } catch (error) {
    // Keep the full storefront rendered on a transient database failure instead
    // of replacing it with a blank-looking fallback page.
    console.error("Unable to load products from the database:", error);
  }

  return <ShopCatalog products={products} />;
}
