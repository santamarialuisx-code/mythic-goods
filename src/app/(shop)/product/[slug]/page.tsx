import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";

import { ProductMedia } from "@/components/shop/product-media";
import { ProductPurchase } from "@/components/shop/product-purchase";
import { getProductBySlug } from "@/lib/catalog/queries";
import { formatPrice } from "@/lib/format";

export const dynamic = "force-dynamic";

// Request-level dedupe: generateMetadata and the page share one query.
const getProduct = cache(getProductBySlug);

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) return { title: "Producto no encontrado" };

  return {
    title: product.name,
    description: product.description ?? undefined,
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) notFound();

  const soldOut = product.totalStock <= 0;

  return (
    <div className="container-page py-10 md:py-14">
      <Link
        href="/catalog"
        className="text-sm text-mist transition-colors hover:text-bone"
      >
        ← Catálogo
      </Link>

      <div className="mt-6 grid gap-10 md:grid-cols-2 md:gap-14">
        <div>
          <ProductMedia
            path={product.primaryImagePath}
            alt={product.images[0]?.alt ?? product.name}
            priority
            sizes="(min-width: 768px) 50vw, 100vw"
            className="aspect-[4/5] rounded-3xl border border-ink-line"
          />

          {product.images.length > 1 ? (
            <div className="mt-3 grid grid-cols-4 gap-3">
              {product.images.slice(0, 4).map((image) => (
                <ProductMedia
                  key={image.path}
                  path={image.path}
                  alt={image.alt}
                  sizes="120px"
                  className="aspect-square rounded-xl border border-ink-line"
                />
              ))}
            </div>
          ) : null}
        </div>

        <div className="md:pt-2">
          {product.category ? (
            <p className="eyebrow">{product.category.name}</p>
          ) : null}

          <h1 className="mt-2 text-3xl font-medium tracking-tight md:text-4xl">
            {product.name}
          </h1>

          <div className="mt-4 flex items-baseline gap-3">
            <p className="text-xl text-bone">
              {formatPrice(product.priceCents, product.currency)}
            </p>
            {product.compareAtCents ? (
              <p className="text-sm text-mist line-through">
                {formatPrice(product.compareAtCents, product.currency)}
              </p>
            ) : null}
          </div>

          {product.description ? (
            <p className="mt-6 text-sm leading-relaxed text-mist">
              {product.description}
            </p>
          ) : null}

          <ProductPurchase product={product} />

          <dl className="mt-10 space-y-3 border-t border-ink-line/70 pt-6 text-xs">
            <div className="flex justify-between gap-4">
              <dt className="text-mist">Disponibilidad</dt>
              <dd className="text-bone">
                {soldOut ? "Agotado" : `${product.totalStock} unidades`}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-mist">Moneda</dt>
              <dd className="font-mono text-bone">{product.currency}</dd>
            </div>
            {product.variants[0]?.sku ? (
              <div className="flex justify-between gap-4">
                <dt className="text-mist">SKU</dt>
                <dd className="font-mono text-bone">
                  {product.variants[0].sku}
                </dd>
              </div>
            ) : null}
          </dl>
        </div>
      </div>
    </div>
  );
}
