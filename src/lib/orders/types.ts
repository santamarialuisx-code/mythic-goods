/** Domain types for the order flow; the UI never sees snake_case rows. */

export type OrderLine = {
  productName: string;
  variantLabel: string | null;
  qty: number;
  unitPriceCents: number;
  lineTotalCents: number;
};

export type OrderSummary = {
  id: string;
  code: string;
  customerName: string;
  customerPhone: string;
  notes: string | null;
  currency: string;
  subtotalCents: number;
  shippingCents: number;
  totalCents: number;
  createdAt: string;
  items: OrderLine[];
};
