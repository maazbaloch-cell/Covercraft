import { prisma } from "@/lib/prisma";
import ShopCatalog, { CatalogProduct } from "@/components/ShopCatalog";

export const dynamic = "force-dynamic";

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
