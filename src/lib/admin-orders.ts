import "server-only";

import { isSupabaseConfigured } from "@/lib/env";
import type { OrderStatus } from "@/lib/orders/status";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Reads for `/admin/orders`.
 *
 * `orders` and `order_items` have no anon policy on purpose, so these reads need
 * the service_role key and the callers gate on `hasServiceRole()` first.
 */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type AdminOrderRow = {
  id: string;
  code: string;
  createdAt: string;
  customerName: string;
  customerPhone: string;
  itemCount: number;
  totalCents: number;
  currency: string;
  status: OrderStatus;
};

export type AdminOrderLine = {
  productName: string;
  variantLabel: string | null;
  qty: number;
  unitPriceCents: number;
  lineTotalCents: number;
  /** `null` when the variant was deleted after the order was written. */
  currentStock: number | null;
};

export type AdminOrderDetail = AdminOrderRow & {
  notes: string | null;
  subtotalCents: number;
  shippingCents: number;
  items: AdminOrderLine[];
};

function canRead() {
  return isSupabaseConfigured && Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
}

/** Newest first; `status` filters to one state. */
export async function listAdminOrders(
  status?: OrderStatus,
): Promise<AdminOrderRow[]> {
  if (!canRead()) return [];

  const supabase = createAdminClient();

  let query = supabase
    .from("orders")
    .select(
      "id, code, created_at, customer_name, customer_phone, total_cents, currency, status",
    )
    .order("created_at", { ascending: false });

  if (status) query = query.eq("status", status);

  const [orders, items] = await Promise.all([
    query,
    supabase.from("order_items").select("order_id"),
  ]);

  if (orders.error) {
    console.error("[admin] listAdminOrders failed:", orders.error.message);
    return [];
  }

  if (items.error) {
    console.error("[admin] listAdminOrders items failed:", items.error.message);
  }

  const itemCountByOrder = new Map<string, number>();
  for (const item of items.data ?? []) {
    itemCountByOrder.set(
      item.order_id,
      (itemCountByOrder.get(item.order_id) ?? 0) + 1,
    );
  }

  return (orders.data ?? []).map((order) => ({
    id: order.id,
    code: order.code,
    createdAt: order.created_at,
    customerName: order.customer_name,
    customerPhone: order.customer_phone,
    itemCount: itemCountByOrder.get(order.id) ?? 0,
    totalCents: order.total_cents,
    currency: order.currency,
    status: order.status,
  }));
}

export async function countOrdersByStatus(): Promise<
  Partial<Record<OrderStatus, number>>
> {
  if (!canRead()) return {};

  const supabase = createAdminClient();
  const { data, error } = await supabase.from("orders").select("status");

  if (error) {
    console.error("[admin] countOrdersByStatus failed:", error.message);
    return {};
  }

  const counts: Partial<Record<OrderStatus, number>> = {};
  for (const row of data ?? []) {
    counts[row.status] = (counts[row.status] ?? 0) + 1;
  }

  return counts;
}

/**
 * One order with its lines. Each line also carries the variant's stock *now*,
 * because stock is not decremented by the order (see the feature document): the
 * owner needs the comparison to adjust inventory by hand.
 */
export async function getAdminOrder(
  id: string,
): Promise<AdminOrderDetail | null> {
  if (!canRead() || !UUID.test(id)) return null;

  const supabase = createAdminClient();

  const { data: order, error } = await supabase
    .from("orders")
    .select(
      "id, code, created_at, customer_name, customer_phone, notes, subtotal_cents, shipping_cents, total_cents, currency, status",
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("[admin] getAdminOrder failed:", error.message);
    return null;
  }

  if (!order) return null;

  const { data: items, error: itemsError } = await supabase
    .from("order_items")
    .select(
      "variant_id, product_name, variant_label, qty, unit_price_cents, line_total_cents",
    )
    .eq("order_id", id)
    .order("product_name");

  if (itemsError) {
    console.error("[admin] getAdminOrder items failed:", itemsError.message);
  }

  const variantIds = (items ?? [])
    .map((item) => item.variant_id)
    .filter((value): value is string => Boolean(value));

  const stockByVariant = new Map<string, number>();

  if (variantIds.length > 0) {
    const { data: variants, error: variantsError } = await supabase
      .from("product_variants")
      .select("id, stock")
      .in("id", variantIds);

    if (variantsError) {
      console.error(
        "[admin] getAdminOrder variants failed:",
        variantsError.message,
      );
    }

    for (const variant of variants ?? []) {
      stockByVariant.set(variant.id, variant.stock);
    }
  }

  return {
    id: order.id,
    code: order.code,
    createdAt: order.created_at,
    customerName: order.customer_name,
    customerPhone: order.customer_phone,
    notes: order.notes,
    itemCount: (items ?? []).length,
    subtotalCents: order.subtotal_cents,
    shippingCents: order.shipping_cents,
    totalCents: order.total_cents,
    currency: order.currency,
    status: order.status,
    items: (items ?? []).map((item) => ({
      productName: item.product_name,
      variantLabel: item.variant_label,
      qty: item.qty,
      unitPriceCents: item.unit_price_cents,
      lineTotalCents: item.line_total_cents,
      currentStock: item.variant_id
        ? (stockByVariant.get(item.variant_id) ?? null)
        : null,
    })),
  };
}
