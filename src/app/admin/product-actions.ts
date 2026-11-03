"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { ADMIN_COOKIE, isAdminSession } from "@/lib/admin-auth";
import {
  parseProductForm,
  type ProductFormState,
  type ProductVariantInput,
} from "@/lib/catalog/schema";
import { isSupabaseConfigured } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Catalog mutations for /admin.
 *
 * `proxy.ts` already gates the routes these actions are posted to. The session
 * check below is the defense in depth for the write path: a server action is an
 * addressable endpoint, and it must not trust that the gate ran.
 */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type AdminClient = ReturnType<typeof createAdminClient>;

type DbError = { code?: string; message: string; details?: string | null };

async function hasAdminSession() {
  const cookieStore = await cookies();

  return isAdminSession(cookieStore.get(ADMIN_COOKIE)?.value);
}

function writeBlockedReason() {
  if (!isSupabaseConfigured) {
    return "Conectá Supabase antes de guardar: sin credenciales la tienda corre con el catálogo mock.";
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return "Falta SUPABASE_SERVICE_ROLE_KEY: el catálogo se escribe con service_role desde el servidor.";
  }

  return null;
}

function toFormError(error: DbError): ProductFormState {
  const hint = `${error.message} ${error.details ?? ""}`.toLowerCase();

  if (error.code === "23505") {
    if (hint.includes("sku")) {
      return {
        status: "error",
        message: "Ese SKU ya existe en otro producto.",
        fieldErrors: {},
      };
    }

    return {
      status: "error",
      message: "Ese slug ya está en uso. Probá otro.",
      fieldErrors: { slug: "Slug repetido." },
    };
  }

  return {
    status: "error",
    message: `No se pudo guardar: ${error.message}`,
    fieldErrors: {},
  };
}

/**
 * Variants are reconciled, not replaced: rows keep their id so a variant an old
 * order points to is preserved. Deleted rows are still safe — `order_items`
 * keeps `product_name` / `variant_label` / `unit_price_cents` snapshots.
 */
async function saveVariants(
  supabase: AdminClient,
  productId: string,
  variants: ProductVariantInput[],
): Promise<ProductFormState | null> {
  const { data: existing, error: readError } = await supabase
    .from("product_variants")
    .select("id")
    .eq("product_id", productId);

  if (readError) {
    return {
      status: "error",
      message: `No se pudieron leer las variantes: ${readError.message}`,
      fieldErrors: {},
    };
  }

  const kept = new Set(variants.flatMap((variant) => (variant.id ? [variant.id] : [])));
  const removed = (existing ?? [])
    .map((variant) => variant.id)
    .filter((id) => !kept.has(id));

  for (const [position, variant] of variants.entries()) {
    const row = {
      product_id: productId,
      size: variant.size,
      color: variant.color,
      sku: variant.sku,
      stock: variant.stock,
      position,
    };

    const { error } = variant.id
      ? await supabase
          .from("product_variants")
          .update(row)
          .eq("id", variant.id)
          .eq("product_id", productId)
      : await supabase.from("product_variants").insert(row);

    if (error) return toFormError(error);
  }

  if (removed.length > 0) {
    const { error } = await supabase
      .from("product_variants")
      .delete()
      .in("id", removed);

    if (error) return toFormError(error);
  }

  return null;
}

export async function saveProductAction(
  _previousState: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  if (!(await hasAdminSession())) {
    return {
      status: "error",
      message: "Sesión vencida. Volvé a entrar.",
      fieldErrors: {},
    };
  }

  const blocked = writeBlockedReason();
  if (blocked) return { status: "error", message: blocked, fieldErrors: {} };

  const parsed = parseProductForm(formData);
  if (!parsed.ok) {
    return {
      status: "error",
      message: parsed.message,
      fieldErrors: parsed.fieldErrors,
    };
  }

  const { values } = parsed;
  const supabase = createAdminClient();

  const row = {
    name: values.name,
    slug: values.slug,
    description: values.description,
    category_id: values.categoryId ?? null,
    price_cents: values.priceCents,
    compare_at_cents: values.compareAtCents,
    currency: values.currency,
    active: values.active,
  };

  let productId = values.id;

  if (productId) {
    const { error } = await supabase
      .from("products")
      .update(row)
      .eq("id", productId);

    if (error) return toFormError(error);
  } else {
    const { data, error } = await supabase
      .from("products")
      .insert(row)
      .select("id")
      .single();

    if (error) return toFormError(error);
    productId = data.id;
  }

  const variantsError = await saveVariants(supabase, productId, values.variants);
  if (variantsError) return variantsError;

  revalidatePath("/");
  revalidatePath("/catalog");
  revalidatePath("/admin");
  revalidatePath("/admin/products");

  redirect("/admin/products");
}

/**
 * Activate / deactivate. There is deliberately no delete: `products` is
 * referenced by historical orders and by the shop RLS policy, so removing a row
 * is a separate, bigger decision.
 */
export async function setProductActiveAction(formData: FormData) {
  if (!(await hasAdminSession())) redirect("/admin/login");

  if (writeBlockedReason()) return;

  const id = String(formData.get("id") ?? "");
  const active = formData.get("active") === "true";

  if (!UUID.test(id)) return;

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("products")
    .update({ active })
    .eq("id", id);

  if (error) {
    console.error("[admin] setProductActive failed:", error.message);
    return;
  }

  revalidatePath("/");
  revalidatePath("/catalog");
  revalidatePath("/admin");
  revalidatePath("/admin/products");
}
