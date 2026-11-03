import "server-only";

import { mockProductList } from "@/lib/catalog/mock";
import { isSupabaseConfigured } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

/**
 * Reads for /admin.
 *
 * Uses the service_role client when available so inactive products and orders
 * are visible; otherwise falls back to the anon client, which RLS restricts to
 * the active catalog.
 */

export type AdminProductRow = {
  id: string;
  slug: string;
  name: string;
  categoryName: string | null;
  priceCents: number;
  currency: string;
  active: boolean;
  totalStock: number;
};

export type AdminOverview = {
  products: number;
  activeProducts: number;
  orders: number;
  pendingOrders: number;
  usingServiceRole: boolean;
};

export function hasServiceRole() {
  return Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export async function getAdminOverview(): Promise<AdminOverview> {
  if (!isSupabaseConfigured) {
    const products = mockProductList();

    return {
      products: products.length,
      activeProducts: products.length,
      orders: 0,
      pendingOrders: 0,
      usingServiceRole: false,
    };
  }

  const usingServiceRole = hasServiceRole();
  const supabase = usingServiceRole
    ? createAdminClient()
    : await createClient();

  const [products, activeProducts, orders, pendingOrders] = await Promise.all([
    supabase.from("products").select("id", { count: "exact", head: true }),
    supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("active", true),
    supabase.from("orders").select("id", { count: "exact", head: true }),
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
  ]);

  for (const [label, result] of [
    ["products", products],
    ["activeProducts", activeProducts],
    ["orders", orders],
    ["pendingOrders", pendingOrders],
  ] as const) {
    if (result.error) {
      console.error(`[admin] overview ${label} failed:`, result.error.message);
    }
  }

  return {
    products: products.count ?? 0,
    activeProducts: activeProducts.count ?? 0,
    orders: orders.count ?? 0,
    pendingOrders: pendingOrders.count ?? 0,
    usingServiceRole,
  };
}

export async function listAdminProducts(): Promise<AdminProductRow[]> {
  if (!isSupabaseConfigured) {
    return mockProductList().map((product) => ({
      id: product.id,
      slug: product.slug,
      name: product.name,
      categoryName: product.category?.name ?? null,
      priceCents: product.priceCents,
      currency: product.currency,
      active: true,
      totalStock: product.totalStock,
    }));
  }

  const supabase = hasServiceRole() ? createAdminClient() : await createClient();

  const [products, categories, variants] = await Promise.all([
    supabase
      .from("products")
      .select("id, slug, name, category_id, price_cents, currency, active")
      .order("created_at", { ascending: false }),
    supabase.from("categories").select("id, name"),
    supabase.from("product_variants").select("product_id, stock"),
  ]);

  if (products.error) {
    console.error("[admin] listAdminProducts failed:", products.error.message);
    return [];
  }

  const categoryNameById = new Map(
    (categories.data ?? []).map((category) => [category.id, category.name]),
  );

  const stockByProduct = new Map<string, number>();
  for (const variant of variants.data ?? []) {
    stockByProduct.set(
      variant.product_id,
      (stockByProduct.get(variant.product_id) ?? 0) + variant.stock,
    );
  }

  return (products.data ?? []).map((product) => ({
    id: product.id,
    slug: product.slug,
    name: product.name,
    categoryName: product.category_id
      ? (categoryNameById.get(product.category_id) ?? null)
      : null,
    priceCents: product.price_cents,
    currency: product.currency,
    active: product.active,
    totalStock: stockByProduct.get(product.id) ?? 0,
  }));
}
