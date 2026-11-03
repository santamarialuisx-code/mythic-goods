"use client";

import Link from "next/link";

import {
  selectTotalUnits,
  useCartHydrated,
  useCartStore,
} from "@/lib/cart/store";

/**
 * Total units in the cart, linking to `/cart`.
 *
 * The count is behind the hydration flag: the persisted cart only exists on the
 * client, so rendering it before mount would break hydration. Before mount and
 * on the server it renders as the empty cart.
 */
export function CartCount() {
  const hydrated = useCartHydrated();
  const units = useCartStore(selectTotalUnits);
  const total = hydrated ? units : 0;

  return (
    <Link
      href="/cart"
      aria-label={
        total > 0
          ? `Carrito, ${total} ${total === 1 ? "unidad" : "unidades"}`
          : "Carrito, vacío"
      }
      className="flex shrink-0 items-center gap-2 rounded-full border border-ink-line px-3.5 py-2 text-xs text-bone transition-colors hover:border-mist/60 hover:bg-ink-soft"
    >
      Carrito
      <span className="font-mono text-[11px] text-mist">
        {total > 0 ? total : "0"}
      </span>
    </Link>
  );
}
