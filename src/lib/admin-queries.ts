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
  primaryImagePath: string | null;
};

export type AdminOverview = {
  products: number;
  activeProducts: number;
  orders: number;
  pendingOrders: number;
  usingServiceRole: boolean;
};

export type AdminCategory = { id: string; name: string };

export type AdminProductForm = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  categoryId: string | null;
  priceCents: number;
  compareAtCents: number | null;
  currency: string;
  active: boolean;
  images: AdminProductImage[];
  variants: {
    id: string;
    size: string | null;
    color: string | null;
    sku: string | null;
    stock: number;
  }[];
};

export type AdminProductImage = {
  id: string;
  path: string;
  alt: string | null;
  position: number;
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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
      primaryImagePath: product.primaryImagePath,
    }));
  }

  const supabase = hasServiceRole() ? createAdminClient() : await createClient();

  const [products, categories, variants, images] = await Promise.all([
    supabase
      .from("products")
      .select("id, slug, name, category_id, price_cents, currency, active")
      .order("created_at", { ascending: false }),
    supabase.from("categories").select("id, name"),
    supabase.from("product_variants").select("product_id, stock"),
    supabase
      .from("product_images")
      .select("product_id, storage_path, position")
      .order("position"),
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

  // Ordered by position, so the first row seen for a product is its main photo.
  const primaryImageByProduct = new Map<string, string>();
  for (const image of images.data ?? []) {
    if (!primaryImageByProduct.has(image.product_id)) {
      primaryImageByProduct.set(image.product_id, image.storage_path);
    }
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
    primaryImagePath: primaryImageByProduct.get(product.id) ?? null,
  }));
}

export async function listAdminCategories(): Promise<AdminCategory[]> {
  if (!isSupabaseConfigured) return [];

  const supabase = hasServiceRole() ? createAdminClient() : await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("id, name")
    .order("position")
    .order("name");

  if (error) {
    console.error("[admin] listAdminCategories failed:", error.message);
    return [];
  }

  return data ?? [];
}

/** Full row for the edit form; `null` when the id is unknown or malformed. */
export async function getAdminProductForm(
  id: string,
): Promise<AdminProductForm | null> {
  if (!isSupabaseConfigured || !UUID.test(id)) return null;

  const supabase = hasServiceRole() ? createAdminClient() : await createClient();

  const [product, variants, images] = await Promise.all([
    supabase
      .from("products")
      .select(
        "id, name, slug, description, category_id, price_cents, compare_at_cents, currency, active",
      )
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("product_variants")
      .select("id, size, color, sku, stock")
      .eq("product_id", id)
      .order("position"),
    supabase
      .from("product_images")
      .select("id, storage_path, alt, position")
      .eq("product_id", id)
      .order("position"),
  ]);

  if (product.error) {
    console.error("[admin] getAdminProductForm failed:", product.error.message);
    return null;
  }

  if (variants.error) {
    console.error(
      "[admin] getAdminProductForm variants failed:",
      variants.error.message,
    );
  }

  if (images.error) {
    console.error(
      "[admin] getAdminProductForm images failed:",
      images.error.message,
    );
  }

  if (!product.data) return null;

  return {
    id: product.data.id,
    name: product.data.name,
    slug: product.data.slug,
    description: product.data.description,
    categoryId: product.data.category_id,
    priceCents: product.data.price_cents,
    compareAtCents: product.data.compare_at_cents,
    currency: product.data.currency,
    active: product.data.active,
    images: (images.data ?? []).map((image) => ({
      id: image.id,
      path: image.storage_path,
      alt: image.alt,
      position: image.position,
    })),
    variants: variants.data ?? [],
  };
}
