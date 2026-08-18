import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import type { CatalogProduct } from "@/components/ShopCatalog";
import HomeExperience from "@/components/home/HomeExperience";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "CoverCraft — Your phone, wrapped in a story",
  description:
    "Cinematic mobile back covers engineered to protect and designed to turn heads. Explore the collection or craft one that's unmistakably yours.",
};

export default async function HomePage() {
  let featured: CatalogProduct[] = [];

  try {
    featured = await prisma.product.findMany({
      where: { deletedAt: null, isActive: true },
      orderBy: { createdAt: "desc" },
      take: 6,
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
    // The landing page must still render its story even if the catalog query
    // fails transiently; the featured strip simply hides when empty.
    console.error("Home: unable to load featured products:", error);
  }

  return <HomeExperience featured={featured} />;
}
