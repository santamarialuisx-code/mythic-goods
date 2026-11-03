import "server-only";

import { mockCategories, mockProductBySlug, mockProductList } from "./mock";
import type { Category, ProductDetail, ProductListItem } from "./types";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";

const PRODUCT_COLUMNS =
  "id, slug, name, description, category_id, price_cents, compare_at_cents, currency, created_at";

/**
 * Reads for the public storefront.
 *
 * Every function falls back to the local mock catalog when Supabase is not
 * configured yet, so `npm run dev` never renders an empty shell.
 * Failures are logged and degrade to empty lists instead of crashing a page.
 */

export async function listCategories(): Promise<Category[]> {
  if (!isSupabaseConfigured) return mockCategories;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("id, slug, name")
    .order("position");

  if (error) {
    console.error("[catalog] listCategories failed:", error.message);
    return [];
  }

  return data ?? [];
}

export async function listProducts(
  options: { categorySlug?: string } = {},
): Promise<ProductListItem[]> {
  if (!isSupabaseConfigured) return filterMock(options.categorySlug);

  const supabase = await createClient();

  const [products, categories, images, variants] = await Promise.all([
    supabase
      .from("products")
      .select(PRODUCT_COLUMNS)
      .eq("active", true)
      .order("created_at", { ascending: false }),
    supabase.from("categories").select("id, slug, name"),
    supabase
      .from("product_images")
      .select("product_id, storage_path, position")
      .order("position"),
    supabase.from("product_variants").select("product_id, stock"),
  ]);

  if (products.error) {
    console.error("[catalog] listProducts failed:", products.error.message);
    return [];
  }

  for (const [label, result] of [
    ["categories", categories],
    ["product_images", images],
    ["product_variants", variants],
  ] as const) {
    if (result.error) {
      console.error(`[catalog] ${label} failed:`, result.error.message);
    }
  }

  const categoryById = new Map(
    (categories.data ?? []).map((category) => [
      category.id,
      { slug: category.slug, name: category.name },
    ]),
  );

  const primaryImageByProduct = new Map<string, string>();
  for (const image of images.data ?? []) {
    if (!primaryImageByProduct.has(image.product_id)) {
      primaryImageByProduct.set(image.product_id, image.storage_path);
    }
  }

  const stockByProduct = new Map<string, number>();
  for (const variant of variants.data ?? []) {
    stockByProduct.set(
      variant.product_id,
      (stockByProduct.get(variant.product_id) ?? 0) + variant.stock,
    );
  }

  const items = (products.data ?? []).map((product) =>
    toListItem(
      product,
      product.category_id ? (categoryById.get(product.category_id) ?? null) : null,
      primaryImageByProduct.get(product.id) ?? null,
      stockByProduct.get(product.id) ?? 0,
    ),
  );

  if (!options.categorySlug) return items;

  return items.filter((item) => item.category?.slug === options.categorySlug);
}

export async function getProductBySlug(
  slug: string,
): Promise<ProductDetail | null> {
  if (!isSupabaseConfigured) return mockProductBySlug(slug);

  const supabase = await createClient();

  const { data: product, error } = await supabase
    .from("products")
    .select(PRODUCT_COLUMNS)
    .eq("slug", slug)
    .eq("active", true)
    .maybeSingle();

  if (error) {
    console.error("[catalog] getProductBySlug failed:", error.message);
    return null;
  }

  if (!product) return null;

  const [category, images, variants] = await Promise.all([
    product.category_id
      ? supabase
          .from("categories")
          .select("slug, name")
          .eq("id", product.category_id)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    supabase
      .from("product_images")
      .select("storage_path, alt, position")
      .eq("product_id", product.id)
      .order("position"),
    supabase
      .from("product_variants")
      .select("id, size, color, sku, stock, position")
      .eq("product_id", product.id)
      .order("position"),
  ]);

  const imageList = images.data ?? [];
  const variantList = variants.data ?? [];

  return {
    ...toListItem(
      product,
      category.data
        ? { slug: category.data.slug, name: category.data.name }
        : null,
      imageList[0]?.storage_path ?? null,
      variantList.reduce((total, variant) => total + variant.stock, 0),
    ),
    images: imageList.map((image) => ({
      path: image.storage_path,
      alt: image.alt,
    })),
    variants: variantList.map((variant) => ({
      id: variant.id,
      size: variant.size,
      color: variant.color,
      sku: variant.sku,
      stock: variant.stock,
    })),
  };
}

function toListItem(
  product: Pick<
    Tables<"products">,
    | "id"
    | "slug"
    | "name"
    | "description"
    | "price_cents"
    | "compare_at_cents"
    | "currency"
  >,
  category: { slug: string; name: string } | null,
  primaryImagePath: string | null,
  totalStock: number,
): ProductListItem {
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    description: product.description,
    priceCents: product.price_cents,
    compareAtCents: product.compare_at_cents,
    currency: product.currency,
    category,
    primaryImagePath,
    totalStock,
  };
}

function filterMock(categorySlug?: string) {
  const items = mockProductList();

  if (!categorySlug) return items;

  return items.filter((item) => item.category?.slug === categorySlug);
}
