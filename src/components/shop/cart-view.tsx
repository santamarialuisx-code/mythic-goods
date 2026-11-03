"use client";

import Link from "next/link";

import { ProductMedia } from "@/components/shop/product-media";
import { Button, ButtonLink } from "@/components/ui/button";
import { useCartHydrated, useCartStore } from "@/lib/cart/store";
import type { CartLine } from "@/lib/cart/types";
import { formatPrice } from "@/lib/format";

/**
 * The cart's own content, rendered straight from the browser store.
 *
 * It is a client component because the cart lives in `localStorage`; the page
 * around it stays a server component so the route keeps its metadata. Nothing
 * here reads the catalog: every line carries its own snapshot.
 */
export function CartView() {
  const hydrated = useCartHydrated();
  const lines = useCartStore((state) => state.lines);

  const currency = lines[0]?.currency ?? "USD";
  const subtotalCents = lines.reduce(
    (total, line) => total + line.quantity * line.unitPriceCents,
    0,
  );

  if (!hydrated) {
    return <p className="mt-8 text-sm text-mist">Cargando tu carrito…</p>;
  }

  if (lines.length === 0) {
    return (
      <div className="mt-10 rounded-2xl border border-dashed border-ink-line p-10 text-center">
        <p className="text-sm text-mist">Todavía no agregaste nada al carrito.</p>
        <ButtonLink href="/catalog" variant="outline" className="mt-4">
          Ver el catálogo
        </ButtonLink>
      </div>
    );
  }

  return (
    <>
      <ul className="mt-10 divide-y divide-ink-line/70 border-y border-ink-line/70">
        {lines.map((line) => (
          <CartRow key={`${line.productId}:${line.variantId}`} line={line} />
        ))}
      </ul>

      <div className="mt-8 flex flex-wrap items-baseline justify-between gap-4">
        <p className="eyebrow">Subtotal</p>
        <p className="text-2xl text-bone">
          {formatPrice(subtotalCents, currency)}
        </p>
      </div>
      <p className="mt-2 max-w-md text-xs leading-relaxed text-mist">
        Es un adelanto: el precio final se confirma por WhatsApp y el envío se
        coordina en el chat.
      </p>
    </>
  );
}

function CartRow({ line }: { line: CartLine }) {
  const setQuantity = useCartStore((state) => state.setQuantity);
  const removeLine = useCartStore((state) => state.removeLine);

  return (
    <li className="flex gap-4 py-5">
      <Link href={`/product/${line.slug}`} className="shrink-0">
        <ProductMedia
          path={line.imagePath}
          alt={line.productName}
          sizes="96px"
          className="h-24 w-20 rounded-xl border border-ink-line"
        />
      </Link>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <Link
              href={`/product/${line.slug}`}
              className="truncate text-sm text-bone hover:underline"
            >
              {line.productName}
            </Link>
            <p className="mt-1 text-xs text-mist">{line.variantLabel}</p>
            <p className="mt-1 font-mono text-[11px] text-mist/80">
              {formatPrice(line.unitPriceCents, line.currency)} c/u
            </p>
          </div>
          <p className="shrink-0 text-sm text-bone">
            {formatPrice(line.unitPriceCents * line.quantity, line.currency)}
          </p>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex items-center rounded-full border border-ink-line">
            <button
              type="button"
              onClick={() =>
                setQuantity(line.productId, line.variantId, line.quantity - 1)
              }
              disabled={line.quantity <= 1}
              aria-label={`Quitá una unidad de ${line.productName} ${line.variantLabel}`}
              className="h-8 w-8 rounded-l-full text-sm text-bone transition-colors hover:bg-ink-soft disabled:pointer-events-none disabled:opacity-40"
            >
              −
            </button>
            <span className="w-8 text-center font-mono text-xs text-bone">
              {line.quantity}
            </span>
            <button
              type="button"
              onClick={() =>
                setQuantity(line.productId, line.variantId, line.quantity + 1)
              }
              disabled={line.quantity >= line.maxQuantity}
              aria-label={`Agregá una unidad de ${line.productName} ${line.variantLabel}`}
              className="h-8 w-8 rounded-r-full text-sm text-bone transition-colors hover:bg-ink-soft disabled:pointer-events-none disabled:opacity-40"
            >
              +
            </button>
          </div>

          <div className="flex items-center gap-4">
            <span className="font-mono text-[10px] uppercase tracking-widest text-mist/70">
              {line.maxQuantity} u. en stock
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => removeLine(line.productId, line.variantId)}
              aria-label={`Quitá ${line.productName} ${line.variantLabel} del carrito`}
              className="px-2 text-xs"
            >
              Quitá
            </Button>
          </div>
        </div>
      </div>
    </li>
  );
}
