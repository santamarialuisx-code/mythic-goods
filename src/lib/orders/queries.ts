import "server-only";

import { isSupabaseConfigured } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";

import type { OrderSummary } from "./types";

/**
 * Reads one order for the confirmation page.
 *
 * The page is reachable by order id, a random uuid: the human-facing `MG-#####`
 * code is sequential and guessable, so it is displayed but never used to look an
 * order up. Orders have no anon policy, which is why this read needs the
 * service_role key.
 */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function getOrderSummary(id: string): Promise<OrderSummary | null> {
  if (!isSupabaseConfigured || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return null;
  }

  if (!UUID.test(id)) return null;

  const supabase = createAdminClient();

  const { data: order, error } = await supabase
    .from("orders")
    .select(
      "id, code, customer_name, customer_phone, notes, currency, subtotal_cents, shipping_cents, total_cents, created_at",
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("[orders] getOrderSummary failed:", error.message);
    return null;
  }

  if (!order) return null;

  const { data: items, error: itemsError } = await supabase
    .from("order_items")
    .select(
      "product_name, variant_label, qty, unit_price_cents, line_total_cents",
    )
    .eq("order_id", id)
    .order("product_name");

  if (itemsError) {
    console.error("[orders] getOrderSummary items failed:", itemsError.message);
  }

  return {
    id: order.id,
    code: order.code,
    customerName: order.customer_name,
    customerPhone: order.customer_phone,
    notes: order.notes,
    currency: order.currency,
    subtotalCents: order.subtotal_cents,
    shippingCents: order.shipping_cents,
    totalCents: order.total_cents,
    createdAt: order.created_at,
    items: (items ?? []).map((item) => ({
      productName: item.product_name,
      variantLabel: item.variant_label,
      qty: item.qty,
      unitPriceCents: item.unit_price_cents,
      lineTotalCents: item.line_total_cents,
    })),
  };
}
