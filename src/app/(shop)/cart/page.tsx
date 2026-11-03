import type { Metadata } from "next";

import { CartView } from "@/components/shop/cart-view";
import { CheckoutForm } from "@/components/shop/checkout-form";

export const metadata: Metadata = {
  title: "Carrito",
  robots: { index: false, follow: false },
};

/**
 * Server shell: it owns the metadata and the layout, while the cart body and the
 * checkout read the browser store as client components.
 */
export default function CartPage() {
  return (
    <div className="container-page py-12 md:py-16">
      {/* One column: the lines, the subtotal and the checkout form share the
          same width, instead of a full-width row with a half-width form. */}
      <div className="max-w-3xl">
        <p className="eyebrow">Carrito</p>
        <h1 className="mt-2 text-3xl font-medium tracking-tight md:text-4xl">
          Lo que llevás
        </h1>

        <CartView />
        <CheckoutForm />
      </div>
    </div>
  );
}
