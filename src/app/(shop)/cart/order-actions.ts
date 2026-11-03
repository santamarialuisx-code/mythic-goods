"use server";

import { z } from "zod";

import { isSupabaseConfigured } from "@/lib/env";
import { formatVariantLabel } from "@/lib/format";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Order creation for the storefront.
 *
 * The cart lives in localStorage, which the visitor fully controls, so nothing
 * about price, label or name is read from it: the browser only says *which*
 * variant and *how many*, and everything else is re-read from the database with
 * the service_role key. `orders` has no anon policy on purpose.
 */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** A cart is a small thing; anything bigger is not a customer. */
const MAX_LINES = 30;
const MAX_QTY = 99;

export type CheckoutState =
  | { status: "idle" }
  | { status: "error"; message: string; fieldErrors: Record<string, string> }
  | { status: "success"; orderId: string; code: string };

const lineSchema = z.object({
  variantId: z.string().regex(UUID, "Variante inválida."),
  qty: z.number().int().min(1, "Cantidad inválida.").max(MAX_QTY, "Cantidad inválida."),
});

const nameField = z
  .string()
  .trim()
  .min(2, "Poné tu nombre.")
  .max(80, "Máximo 80 caracteres.");

const phoneField = z.string().transform((raw, ctx) => {
  const digits = raw.replace(/\D/g, "");

  if (digits.length === 0) {
    ctx.addIssue({
      code: "custom",
      message: "Poné un teléfono para coordinar la entrega.",
    });
    return z.NEVER;
  }

  if (digits.length < 7 || digits.length > 15) {
    ctx.addIssue({ code: "custom", message: "Ese teléfono no parece válido." });
    return z.NEVER;
  }

  return digits;
});

const notesField = z.string().transform((raw, ctx) => {
  const value = raw.trim();

  if (value.length === 0) return null;

  if (value.length > 500) {
    ctx.addIssue({ code: "custom", message: "Máximo 500 caracteres." });
    return z.NEVER;
  }

  return value;
});

type CheckoutValues = {
  customerName: string;
  customerPhone: string;
  notes: string | null;
  lines: { variantId: string; qty: number }[];
};

const SAVE_FAILED = "No pudimos guardar el pedido. Probá de nuevo en un rato.";

function cartError(message: string): CheckoutState {
  return { status: "error", message, fieldErrors: {} };
}

/**
 * FormData in, validated values out. The cart arrives as one JSON field because
 * it is a list of pairs, not a repeated form key per line.
 */
function parseCheckout(
  formData: FormData,
):
  | { ok: true; values: CheckoutValues }
  | { ok: false; message: string; fieldErrors: Record<string, string> } {
  const rawItems = String(formData.get("items") ?? "");

  let parsedItems: unknown;
  try {
    parsedItems = JSON.parse(rawItems);
  } catch {
    return {
      ok: false,
      message: "No pudimos leer el carrito. Recargá la página.",
      fieldErrors: {},
    };
  }

  const items = z.array(lineSchema).min(1).max(MAX_LINES).safeParse(parsedItems);

  if (!items.success) {
    if (Array.isArray(parsedItems) && parsedItems.length === 0) {
      return { ok: false, message: "El carrito está vacío.", fieldErrors: {} };
    }

    if (Array.isArray(parsedItems) && parsedItems.length > MAX_LINES) {
      return {
        ok: false,
        message: `El carrito es demasiado grande: máximo ${MAX_LINES} líneas.`,
        fieldErrors: {},
      };
    }

    return {
      ok: false,
      message:
        "El carrito tiene datos inválidos. Recargá la página y volvé a intentar.",
      fieldErrors: {},
    };
  }

  // A duplicate pair is merged instead of rejected: the browser should never
  // send one, but qty per variant is a single invariant downstream.
  const merged = new Map<string, number>();
  for (const item of items.data) {
    merged.set(item.variantId, Math.min(MAX_QTY, (merged.get(item.variantId) ?? 0) + item.qty));
  }

  const fields = z
    .object({
      customerName: nameField,
      customerPhone: phoneField,
      notes: notesField,
    })
    .safeParse({
      customerName: formData.get("customerName"),
      customerPhone: formData.get("customerPhone"),
      notes: formData.get("notes") ?? "",
    });

  if (!fields.success) {
    const fieldErrors: Record<string, string> = {};

    for (const issue of fields.error.issues) {
      const key = String(issue.path[0] ?? "");
      if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }

    return {
      ok: false,
      message: "Revisá los datos de contacto.",
      fieldErrors,
    };
  }

  return {
    ok: true,
    values: {
      customerName: fields.data.customerName,
      customerPhone: fields.data.customerPhone,
      notes: fields.data.notes,
      lines: [...merged].map(([variantId, qty]) => ({ variantId, qty })),
    },
  };
}

export async function createOrderAction(
  _previousState: CheckoutState,
  formData: FormData,
): Promise<CheckoutState> {
  if (!isSupabaseConfigured) {
    return cartError(
      "La tienda corre con el catálogo de prueba: conectá Supabase para recibir pedidos.",
    );
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return cartError(
      "Falta SUPABASE_SERVICE_ROLE_KEY: los pedidos se escriben con service_role desde el servidor.",
    );
  }

  const parsed = parseCheckout(formData);
  if (!parsed.ok) {
    return {
      status: "error",
      message: parsed.message,
      fieldErrors: parsed.fieldErrors,
    };
  }

  const { values } = parsed;
  const supabase = createAdminClient();

  const { data: variants, error: variantsError } = await supabase
    .from("product_variants")
    .select("id, product_id, size, color, stock")
    .in(
      "id",
      values.lines.map((line) => line.variantId),
    );

  if (variantsError) {
    console.error("[orders] variant read failed:", variantsError.message);
    return cartError("No pudimos leer el catálogo. Probá de nuevo en un rato.");
  }

  const variantById = new Map((variants ?? []).map((variant) => [variant.id, variant]));

  const { data: products, error: productsError } = await supabase
    .from("products")
    .select("id, name, price_cents, currency, active")
    .in("id", [...new Set((variants ?? []).map((variant) => variant.product_id))]);

  if (productsError) {
    console.error("[orders] product read failed:", productsError.message);
    return cartError("No pudimos leer el catálogo. Probá de nuevo en un rato.");
  }

  const productById = new Map((products ?? []).map((product) => [product.id, product]));

  const lines: {
    variantId: string;
    productName: string;
    variantLabel: string | null;
    qty: number;
    unitPriceCents: number;
    lineTotalCents: number;
    currency: string;
  }[] = [];

  for (const line of values.lines) {
    const variant = variantById.get(line.variantId);

    if (!variant) {
      return cartError(
        "Una de las variantes ya no existe. Volvé al catálogo y armá el carrito de nuevo.",
      );
    }

    const product = productById.get(variant.product_id);

    if (!product || !product.active) {
      return cartError(
        `"${product?.name ?? "Un producto"}" ya no está disponible. Quitalo del carrito.`,
      );
    }

    const variantLabel = formatVariantLabel(variant.size, variant.color);

    if (variant.stock < line.qty) {
      return cartError(
        variant.stock === 0
          ? `${product.name} (${variantLabel}) se agotó. Quitalo del carrito.`
          : `Quedan ${variant.stock} de ${product.name} (${variantLabel}). Ajustá la cantidad.`,
      );
    }

    lines.push({
      variantId: variant.id,
      productName: product.name,
      variantLabel,
      qty: line.qty,
      unitPriceCents: product.price_cents,
      lineTotalCents: product.price_cents * line.qty,
      currency: product.currency,
    });
  }

  const currencies = new Set(lines.map((line) => line.currency));

  if (currencies.size > 1) {
    return cartError("El carrito mezcla monedas. Dejá productos en una sola moneda.");
  }

  const subtotalCents = lines.reduce((total, line) => total + line.lineTotalCents, 0);
  const shippingCents = 0; // delivery is agreed in the chat
  const currency = lines[0].currency;

  // supabase-js has no transaction: the header row and its lines are two
  // statements. Every failure below removes the header it just wrote, so a
  // phantom order cannot survive an items failure or a thrown error.
  let created: { id: string; code: string } | null = null;

  try {
    const { data, error } = await supabase
      .from("orders")
      .insert({
        customer_name: values.customerName,
        customer_phone: values.customerPhone,
        notes: values.notes,
        subtotal_cents: subtotalCents,
        shipping_cents: shippingCents,
        total_cents: subtotalCents + shippingCents,
        currency,
        status: "pending",
      })
      .select("id, code")
      .single();

    if (error) {
      console.error("[orders] insert failed:", error.message);
      return cartError(SAVE_FAILED);
    }

    created = data;

    const { error: itemsError } = await supabase.from("order_items").insert(
      lines.map((line) => ({
        order_id: created!.id,
        variant_id: line.variantId,
        product_name: line.productName,
        variant_label: line.variantLabel,
        qty: line.qty,
        unit_price_cents: line.unitPriceCents,
        line_total_cents: line.lineTotalCents,
      })),
    );

    if (itemsError) {
      console.error("[orders] items insert failed:", itemsError.message, created.id);
      throw new Error(itemsError.message);
    }
  } catch (cause) {
    if (created) {
      const { error: cleanupError } = await supabase
        .from("orders")
        .delete()
        .eq("id", created.id);

      if (cleanupError) {
        console.error(
          "[orders] empty order cleanup failed:",
          cleanupError.message,
          created.id,
        );
      }
    }

    if (cause instanceof Error) {
      console.error("[orders] order write failed:", cause.message);
    }

    return cartError(SAVE_FAILED);
  }

  if (!created) return cartError(SAVE_FAILED);

  return { status: "success", orderId: created.id, code: created.code };
}
