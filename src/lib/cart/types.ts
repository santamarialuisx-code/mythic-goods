/**
 * Shapes for the browser cart.
 *
 * A line is identified by product + variant. Everything a line renders travels
 * with it as a snapshot, so `/cart` never reads the catalog to show what the
 * visitor picked. The server recomputes prices before an order is written.
 */

export type CartLineSnapshot = {
  productId: string;
  variantId: string;
  /** Product slug, so a line can link back to its page. */
  slug: string;
  productName: string;
  /** `formatVariantLabel(size, color)` at the moment it was added. */
  variantLabel: string;
  unitPriceCents: number;
  currency: string;
  /** Storage path of the product photo, `null` for the generated placeholder. */
  imagePath: string | null;
  /** Stock that variant had when it was added; the cap for every stepper. */
  maxQuantity: number;
};

export type CartLine = CartLineSnapshot & {
  quantity: number;
};
