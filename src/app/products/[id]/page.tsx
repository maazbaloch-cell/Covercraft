import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ProductDetail from "@/components/ProductDetail";
import ProductCard from "@/components/ProductCard";
import type { CatalogProduct } from "@/components/ShopCatalog";

export const dynamic = "force-dynamic";

async function getProduct(id: string) {
  try {
    return await prisma.product.findFirst({ where: { id, deletedAt: null, isActive: true } });
  } catch (error) {
    console.error("Unable to load product from the database:", error);
    return null;
  }
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const product = await getProduct(params.id);
  if (!product) return { title: "Product not found — CoverCraft" };
  return {
    title: `${product.title} — CoverCraft`,
    description: product.description ?? "Premium mobile back covers, designed to be seen.",
  };
}

export default async function ProductPage({ params }: { params: { id: string } }) {
  const product = await getProduct(params.id);
  if (!product) notFound();

  let related: CatalogProduct[] = [];
  try {
    related = await prisma.product.findMany({
      where: { deletedAt: null, isActive: true, id: { not: product.id }, ...(product.category ? { category: product.category } : {}) },
      orderBy: { createdAt: "desc" },
      take: 4,
      select: { id: true, title: true, description: true, imageUrl: true, price: true, category: true, brand: true, model: true, stock: true, isAvailable: true, createdAt: true },
    });
  } catch (error) {
    console.error("Unable to load related products:", error);
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <nav className="mb-6 text-sm text-slate-500">
        <a href="/" className="font-semibold text-violet-700 hover:underline">Shop</a>
        <span className="mx-2">/</span>
        <span className="text-slate-700">{product.title}</span>
      </nav>

      <ProductDetail
        id={product.id}
        title={product.title}
        price={product.price}
        imageUrl={product.imageUrl}
        description={product.description}
        category={product.category}
        brand={product.brand}
        model={product.model}
        stock={product.stock}
        isAvailable={product.isAvailable}
      />

      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="text-2xl font-black text-slate-950">You may also like</h2>
          <div className="mt-6 grid grid-cols-2 gap-5 lg:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} {...p} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
