import type { Metadata } from "next";
import Link from "next/link";

import { ProductCard } from "@/components/shop/product-card";
import { listCategories, listProducts } from "@/lib/catalog/queries";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Catálogo",
  description: "Ropa, accesorios, hogar y papelería de Mythic Goods.",
};

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ categoria?: string | string[] }>;
}) {
  const params = await searchParams;
  const rawCategory = params.categoria;
  const categorySlug = Array.isArray(rawCategory)
    ? rawCategory[0]
    : rawCategory;

  const [products, categories] = await Promise.all([
    listProducts({ categorySlug }),
    listCategories(),
  ]);

  const activeCategory =
    categories.find((category) => category.slug === categorySlug) ?? null;

  return (
    <div className="container-page py-12 md:py-16">
      <p className="eyebrow">Catálogo</p>
      <h1 className="mt-2 text-3xl font-medium tracking-tight md:text-4xl">
        {activeCategory ? activeCategory.name : "Todo lo que hay"}
      </h1>
      <p className="mt-3 max-w-xl text-sm leading-relaxed text-mist">
        {products.length} {products.length === 1 ? "producto" : "productos"}
        {activeCategory ? ` en ${activeCategory.name}` : " activos"}.
      </p>

      <nav aria-label="Filtrar por categoría" className="mt-8 flex flex-wrap gap-2">
        <FilterChip href="/catalog" active={!categorySlug}>
          Todo
        </FilterChip>
        {categories.map((category) => (
          <FilterChip
            key={category.id}
            href={`/catalog?categoria=${category.slug}`}
            active={category.slug === categorySlug}
          >
            {category.name}
          </FilterChip>
        ))}
      </nav>

      {products.length > 0 ? (
        <div className="mt-10 grid grid-cols-2 gap-x-5 gap-y-10 lg:grid-cols-4">
          {products.map((product, index) => (
            <ProductCard
              key={product.id}
              product={product}
              priority={index < 2}
            />
          ))}
        </div>
      ) : (
        <div className="mt-10 rounded-2xl border border-dashed border-ink-line p-10 text-center">
          <p className="text-sm text-mist">
            No hay productos en esta categoría todavía.
          </p>
          <Link
            href="/catalog"
            className="mt-3 inline-block text-sm text-bone underline decoration-mist/50 underline-offset-4"
          >
            Ver todo el catálogo
          </Link>
        </div>
      )}
    </div>
  );
}

function FilterChip({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "rounded-full border px-4 py-2 text-sm transition-colors",
        active
          ? "border-bone bg-bone text-ink"
          : "border-ink-line text-mist hover:border-mist/50 hover:text-bone",
      )}
    >
      {children}
    </Link>
  );
}
