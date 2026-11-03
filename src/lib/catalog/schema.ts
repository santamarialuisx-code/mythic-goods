import { z } from "zod";

import { parseMoneyInput } from "@/lib/catalog/money";
import { slugify } from "@/lib/utils";

/**
 * Product form contract: FormData in, validated `ProductFormValues` out.
 *
 * Shared by the server action (which writes) and the form component (which
 * reads `fieldErrors`), so this module must stay free of `server-only`.
 * Messages are in Spanish because they render straight into the panel.
 */

export const MAX_VARIANTS = 40;

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const STOCK = /^\d{1,6}$/;

const MONEY_MESSAGE = "Precio inválido. Usá 18 o 18.50.";

export type ProductVariantInput = {
  id?: string;
  size: string | null;
  color: string | null;
  sku: string | null;
  stock: number;
};

export type ProductFormValues = {
  id?: string;
  name: string;
  slug: string;
  description: string | null;
  categoryId: string | null;
  priceCents: number;
  compareAtCents: number | null;
  currency: string;
  active: boolean;
  variants: ProductVariantInput[];
};

export type ProductFormFieldErrors = Record<string, string>;

export type ProductFormState =
  | { status: "idle" }
  | { status: "error"; message: string; fieldErrors: ProductFormFieldErrors };

export type ParsedProductForm =
  | { ok: true; values: ProductFormValues }
  | { ok: false; message: string; fieldErrors: ProductFormFieldErrors };

/** Empty text becomes `null` so the column stays NULL instead of `""`. */
function optionalText(max: number, label: string) {
  return z.string().transform((raw, ctx) => {
    const value = raw.trim();

    if (value.length === 0) return null;
    if (value.length > max) {
      ctx.addIssue({
        code: "custom",
        message: `${label}: máximo ${max} caracteres.`,
      });
      return z.NEVER;
    }

    return value;
  });
}

function optionalId() {
  return z.string().transform((raw, ctx) => {
    const value = raw.trim();

    if (value.length === 0) return undefined;
    if (!UUID.test(value)) {
      ctx.addIssue({ code: "custom", message: "Identificador inválido." });
      return z.NEVER;
    }

    return value;
  });
}

/** `"18.50"` → `1850`. Empty is allowed and means "no value". */
const optionalCents = z.string().transform((raw, ctx) => {
  const parsed = parseMoneyInput(raw);

  if (parsed.ok) return parsed.cents;
  if (parsed.reason === "empty") return null;

  ctx.addIssue({ code: "custom", message: MONEY_MESSAGE });
  return z.NEVER;
});

const requiredCents = z.string().transform((raw, ctx) => {
  const parsed = parseMoneyInput(raw);

  if (parsed.ok) return parsed.cents;

  ctx.addIssue({
    code: "custom",
    message: parsed.reason === "empty" ? "Poné un precio." : MONEY_MESSAGE,
  });
  return z.NEVER;
});

const stockValue = z.string().transform((raw, ctx) => {
  const value = raw.trim();

  if (value.length === 0) return 0;
  if (!STOCK.test(value)) {
    ctx.addIssue({
      code: "custom",
      message: "Usá un número entero de 0 o más.",
    });
    return z.NEVER;
  }

  return Number(value);
});

const variantSchema = z.object({
  id: optionalId(),
  size: optionalText(24, "Talle"),
  color: optionalText(24, "Color"),
  sku: optionalText(40, "SKU"),
  stock: stockValue,
});

const productSchema = z
  .object({
    id: optionalId(),
    name: z
      .string()
      .transform((raw) => raw.trim())
      .pipe(
        z
          .string()
          .min(1, "Poné un nombre.")
          .max(120, "Nombre: máximo 120 caracteres."),
      ),
    slug: z.string(),
    description: optionalText(2000, "Descripción"),
    categoryId: optionalId(),
    priceCents: requiredCents,
    compareAtCents: optionalCents,
    currency: z.string().transform((raw, ctx) => {
      const value = raw.trim().toUpperCase() || "USD";

      if (!/^[A-Z]{3}$/.test(value)) {
        ctx.addIssue({ code: "custom", message: "Usá USD, EUR…" });
        return z.NEVER;
      }

      return value;
    }),
    active: z.boolean(),
    variants: z
      .array(variantSchema)
      .max(MAX_VARIANTS, `Máximo ${MAX_VARIANTS} variantes.`),
  })
  .transform((value, ctx) => {
    const slug = value.slug.trim() === "" ? slugify(value.name) : slugify(value.slug);

    if (!SLUG.test(slug)) {
      ctx.addIssue({
        code: "custom",
        path: ["slug"],
        message: "Solo minúsculas, números y guiones (mi-remera-01).",
      });
      return z.NEVER;
    }

    if (value.compareAtCents !== null && value.compareAtCents < value.priceCents) {
      ctx.addIssue({
        code: "custom",
        path: ["compareAtCents"],
        message: "El precio tachado no puede ser menor al precio.",
      });
      return z.NEVER;
    }

    // A row with nothing in it is an empty slot the owner left behind.
    const variants = value.variants.filter(
      (variant) =>
        variant.id ||
        variant.size ||
        variant.color ||
        variant.sku ||
        variant.stock > 0,
    );

    const seen = new Set<string>();
    for (const variant of variants) {
      const key = `${variant.size?.toLowerCase() ?? ""}|${
        variant.color?.toLowerCase() ?? ""
      }`;

      if (seen.has(key)) {
        ctx.addIssue({
          code: "custom",
          path: ["variants"],
          message: "Hay dos variantes con el mismo talle y color.",
        });
        return z.NEVER;
      }

      seen.add(key);
    }

    return { ...value, slug, variants, categoryId: value.categoryId ?? null };
  });

const VARIANT_KEY = /^variant\.(\d+)\.(id|size|color|sku|stock)$/;

function readVariant(formData: FormData, index: number) {
  const field = (name: string) =>
    String(formData.get(`variant.${index}.${name}`) ?? "");

  return {
    id: field("id"),
    size: field("size"),
    color: field("color"),
    sku: field("sku"),
    stock: field("stock"),
  };
}

function readVariants(formData: FormData) {
  const indexes = new Set<number>();

  for (const key of formData.keys()) {
    const match = VARIANT_KEY.exec(key);
    if (match) indexes.add(Number(match[1]));
  }

  return [...indexes]
    .sort((a, b) => a - b)
    .map((index) => readVariant(formData, index));
}

/** `["variants", 0, "stock"]` → `"variant.0.stock"`, the FormData field name. */
function fieldKey(path: PropertyKey[]) {
  if (path[0] === "variants" && typeof path[1] === "number") {
    return path.length > 2
      ? `variant.${path[1]}.${String(path[2])}`
      : `variant.${path[1]}`;
  }

  return path.map(String).join(".");
}

export function parseProductForm(formData: FormData): ParsedProductForm {
  const result = productSchema.safeParse({
    id: String(formData.get("id") ?? ""),
    name: String(formData.get("name") ?? ""),
    slug: String(formData.get("slug") ?? ""),
    description: String(formData.get("description") ?? ""),
    categoryId: String(formData.get("categoryId") ?? ""),
    priceCents: String(formData.get("priceCents") ?? ""),
    compareAtCents: String(formData.get("compareAtCents") ?? ""),
    currency: String(formData.get("currency") ?? ""),
    active: formData.get("active") === "on",
    variants: readVariants(formData),
  });

  if (result.success) return { ok: true, values: result.data };

  const fieldErrors: ProductFormFieldErrors = {};

  for (const issue of result.error.issues) {
    const key = fieldKey(issue.path);
    fieldErrors[key] ??= issue.message;
  }

  return {
    ok: false,
    message: "Revisá los campos marcados.",
    fieldErrors,
  };
}
