import Link from "next/link";

import { ProductMedia } from "@/components/shop/product-media";
import type { ProductListItem } from "@/lib/catalog/types";
import { formatPrice } from "@/lib/format";

export function ProductCard({
  product,
  priority = false,
}: {
  product: ProductListItem;
  priority?: boolean;
}) {
  const soldOut = product.totalStock <= 0;

  return (
    <Link href={`/product/${product.slug}`} className="group block">
      <div className="relative">
        <ProductMedia
          path={product.primaryImagePath}
          alt={product.name}
          priority={priority}
          className="aspect-[4/5] rounded-2xl border border-ink-line transition-colors group-hover:border-mist/40"
        />
        {soldOut ? (
          <span className="absolute left-3 top-3 rounded-full bg-ink/85 px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest text-mist backdrop-blur">
            Agotado
          </span>
        ) : null}
      </div>

      <div className="mt-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          {product.category ? (
            <p className="eyebrow">{product.category.name}</p>
          ) : null}
          <h3 className="mt-1 truncate text-[15px] leading-snug text-bone">
            {product.name}
          </h3>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-[15px] text-bone">
            {formatPrice(product.priceCents, product.currency)}
          </p>
          {product.compareAtCents ? (
            <p className="text-xs text-mist line-through">
              {formatPrice(product.compareAtCents, product.currency)}
            </p>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
