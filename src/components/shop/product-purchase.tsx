"use client";

import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { clampQuantity, useCartStore } from "@/lib/cart/store";
import type { ProductDetail } from "@/lib/catalog/types";
import { formatVariantLabel } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * Variant picker, quantity stepper and "add to cart" for one product.
 *
 * It owns the visitor's choice and writes a single snapshot line into the cart;
 * the product page stays a server component around it.
 */
export function ProductPurchase({ product }: { product: ProductDetail }) {
  const addLine = useCartStore((state) => state.addLine);

  const [variantId, setVariantId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [confirmation, setConfirmation] = useState<string | null>(null);

  const soldOut = product.totalStock <= 0;
  const variant = product.variants.find((item) => item.id === variantId) ?? null;
  const maxQuantity = variant ? variant.stock : 1;

  function chooseVariant(id: string) {
    setVariantId(id);
    setQuantity(1);
    setConfirmation(null);
  }

  function changeQuantity(next: number) {
    setQuantity(clampQuantity(next, maxQuantity));
  }

  function addToCart() {
    if (!variant || variant.stock < 1) return;

    const label = formatVariantLabel(variant.size, variant.color);

    addLine({
      productId: product.id,
      variantId: variant.id,
      slug: product.slug,
      productName: product.name,
      variantLabel: label,
      unitPriceCents: product.priceCents,
      currency: product.currency,
      imagePath: product.primaryImagePath,
      maxQuantity: variant.stock,
      quantity,
    });

    setConfirmation(`Agregamos ${quantity} × ${label} al carrito.`);
  }

  return (
    <div className="mt-8">
      <p className="eyebrow">Variantes</p>
      <ul className="mt-3 flex flex-wrap gap-2">
        {product.variants.map((item) => {
          const available = item.stock > 0;
          const active = item.id === variantId;

          return (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => chooseVariant(item.id)}
                disabled={!available}
                aria-pressed={active}
                className={cn(
                  "rounded-full border px-3.5 py-2 text-xs transition-colors",
                  active
                    ? "border-bone bg-bone text-ink"
                    : "border-ink-line text-bone hover:border-mist/60 hover:bg-ink-soft",
                  !available &&
                    "cursor-not-allowed border-ink-line/60 bg-transparent text-mist/50 line-through hover:border-ink-line/60 hover:bg-transparent",
                )}
              >
                {formatVariantLabel(item.size, item.color)}
                <span className="ml-2 font-mono text-[10px] opacity-70">
                  {available ? `${item.stock} u.` : "agotado"}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <span className="eyebrow">Cantidad</span>
        <div className="inline-flex items-center rounded-full border border-ink-line">
          <button
            type="button"
            onClick={() => changeQuantity(quantity - 1)}
            disabled={!variant || quantity <= 1}
            aria-label="Quitá una unidad"
            className="h-9 w-9 rounded-l-full text-sm text-bone transition-colors hover:bg-ink-soft disabled:pointer-events-none disabled:opacity-40"
          >
            −
          </button>
          <span className="w-9 text-center font-mono text-sm text-bone">
            {quantity}
          </span>
          <button
            type="button"
            onClick={() => changeQuantity(quantity + 1)}
            disabled={!variant || quantity >= maxQuantity}
            aria-label="Agregá una unidad"
            className="h-9 w-9 rounded-r-full text-sm text-bone transition-colors hover:bg-ink-soft disabled:pointer-events-none disabled:opacity-40"
          >
            +
          </button>
        </div>
        <span className="text-xs text-mist">
          {variant
            ? `${variant.stock} disponibles`
            : "Elegí una variante para seguir"}
        </span>
      </div>

      <div className="mt-6">
        <Button
          type="button"
          onClick={addToCart}
          disabled={soldOut || !variant}
          className="w-full sm:w-auto"
        >
          {soldOut ? "Sin stock" : "Agregar al carrito"}
        </Button>

        {confirmation ? (
          <p role="status" className="mt-3 text-xs leading-relaxed text-bone">
            {confirmation}{" "}
            <Link
              href="/cart"
              className="text-iris underline decoration-iris/40 underline-offset-4 hover:text-iris-soft"
            >
              Ver carrito
            </Link>
          </p>
        ) : (
          <p className="mt-3 text-xs leading-relaxed text-mist/80">
            El carrito queda guardado en este navegador.
          </p>
        )}
      </div>
    </div>
  );
}
