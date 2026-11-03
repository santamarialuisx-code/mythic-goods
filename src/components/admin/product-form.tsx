"use client";

import { useActionState, useId, useState } from "react";

import { saveProductAction } from "@/app/admin/product-actions";
import { Button, ButtonLink } from "@/components/ui/button";
import type { AdminCategory, AdminProductForm } from "@/lib/admin-queries";
import { formatMoneyInput } from "@/lib/catalog/money";
import type { ProductFormState } from "@/lib/catalog/schema";
import { slugify } from "@/lib/utils";

const initialState: ProductFormState = { status: "idle" };

const labelClass =
  "mb-1.5 block font-mono text-[11px] uppercase tracking-[0.18em] text-mist";

const fieldClass =
  "h-11 w-full rounded-xl border border-ink-line bg-ink-soft px-3.5 text-sm text-bone outline-none transition-colors placeholder:text-mist/50 focus:border-iris";

type VariantRow = {
  key: string;
  id?: string;
  size: string;
  color: string;
  sku: string;
  stock: string;
};

let rowCounter = 0;

function emptyRow(): VariantRow {
  rowCounter += 1;

  return { key: `new-${rowCounter}`, size: "", color: "", sku: "", stock: "0" };
}

function toRows(product: AdminProductForm | undefined): VariantRow[] {
  if (!product || product.variants.length === 0) return [emptyRow()];

  return product.variants.map((variant) => ({
    key: variant.id,
    id: variant.id,
    size: variant.size ?? "",
    color: variant.color ?? "",
    sku: variant.sku ?? "",
    stock: String(variant.stock),
  }));
}

function FieldError({ message }: { message: string | undefined }) {
  if (!message) return null;

  return (
    <p role="alert" className="mt-1.5 text-xs text-red-300">
      {message}
    </p>
  );
}

export function ProductForm({
  categories,
  product,
}: {
  categories: AdminCategory[];
  product?: AdminProductForm;
}) {
  const [state, formAction, pending] = useActionState(
    saveProductAction,
    initialState,
  );

  const [name, setName] = useState(product?.name ?? "");
  const [slug, setSlug] = useState(product?.slug ?? "");
  const [slugEdited, setSlugEdited] = useState(Boolean(product?.slug));
  const [rows, setRows] = useState<VariantRow[]>(() => toRows(product));

  const errors = state.status === "error" ? state.fieldErrors : {};
  const variantsError = errors.variants;
  const fieldId = useId();

  function handleName(value: string) {
    setName(value);

    // Typing a name fills the slug until the owner edits the slug by hand.
    if (!slugEdited) setSlug(slugify(value));
  }

  function updateRow(index: number, patch: Partial<VariantRow>) {
    setRows((current) =>
      current.map((row, position) =>
        position === index ? { ...row, ...patch } : row,
      ),
    );
  }

  function removeRow(index: number) {
    setRows((current) => current.filter((_, position) => position !== index));
  }

  return (
    <form action={formAction} className="max-w-3xl space-y-8">
      {product ? <input type="hidden" name="id" value={product.id} /> : null}

      {state.status === "error" ? (
        <p
          role="alert"
          className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200"
        >
          {state.message}
        </p>
      ) : null}

      <section className="space-y-5">
        <div>
          <label htmlFor={`${fieldId}-name`} className={labelClass}>
            Nombre
          </label>
          <input
            id={`${fieldId}-name`}
            name="name"
            value={name}
            onChange={(event) => handleName(event.target.value)}
            required
            autoFocus={!product}
            className={fieldClass}
            placeholder="Remera Mítica"
          />
          <FieldError message={errors.name} />
        </div>

        <div>
          <label htmlFor={`${fieldId}-slug`} className={labelClass}>
            Slug (URL)
          </label>
          <input
            id={`${fieldId}-slug`}
            name="slug"
            value={slug}
            onChange={(event) => {
              setSlug(event.target.value);
              setSlugEdited(true);
            }}
            className={fieldClass}
            placeholder="remera-mitica"
            spellCheck={false}
          />
          <p className="mt-1.5 text-xs text-mist/70">
            Se usa en /product/&lt;slug&gt;. Si lo dejás vacío se arma solo con
            el nombre.
          </p>
          <FieldError message={errors.slug} />
        </div>

        <div>
          <label htmlFor={`${fieldId}-category`} className={labelClass}>
            Categoría
          </label>
          <select
            id={`${fieldId}-category`}
            name="categoryId"
            defaultValue={product?.categoryId ?? ""}
            className={`${fieldClass} appearance-none`}
          >
            <option value="">Sin categoría</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          <FieldError message={errors.categoryId} />
        </div>

        <div>
          <label htmlFor={`${fieldId}-description`} className={labelClass}>
            Descripción
          </label>
          <textarea
            id={`${fieldId}-description`}
            name="description"
            defaultValue={product?.description ?? ""}
            rows={4}
            className="w-full rounded-xl border border-ink-line bg-ink-soft px-3.5 py-3 text-sm leading-relaxed text-bone outline-none transition-colors placeholder:text-mist/50 focus:border-iris"
            placeholder="Algodón pesado, corte relajado, estampa al agua."
          />
          <FieldError message={errors.description} />
        </div>

        <div className="grid gap-5 sm:grid-cols-3">
          <div>
            <label htmlFor={`${fieldId}-price`} className={labelClass}>
              Precio
            </label>
            <input
              id={`${fieldId}-price`}
              name="priceCents"
              inputMode="decimal"
              defaultValue={formatMoneyInput(product?.priceCents)}
              required
              className={fieldClass}
              placeholder="18.50"
            />
            <FieldError message={errors.priceCents} />
          </div>

          <div>
            <label htmlFor={`${fieldId}-compare`} className={labelClass}>
              Precio tachado
            </label>
            <input
              id={`${fieldId}-compare`}
              name="compareAtCents"
              inputMode="decimal"
              defaultValue={formatMoneyInput(product?.compareAtCents)}
              className={fieldClass}
              placeholder="—"
            />
            <FieldError message={errors.compareAtCents} />
          </div>

          <div>
            <label htmlFor={`${fieldId}-currency`} className={labelClass}>
              Moneda
            </label>
            <input
              id={`${fieldId}-currency`}
              name="currency"
              defaultValue={product?.currency ?? "USD"}
              maxLength={3}
              className={`${fieldClass} uppercase`}
            />
            <FieldError message={errors.currency} />
          </div>
        </div>

        <label className="flex w-fit items-center gap-3 text-sm text-bone">
          <input
            type="checkbox"
            name="active"
            defaultChecked={product?.active ?? true}
            className="h-4 w-4 accent-bone"
          />
          Visible en la tienda
        </label>
      </section>

      <section>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="eyebrow">Variantes</p>
            <p className="mt-1 text-xs text-mist/70">
              Una fila por combinación vendible. El stock vive en la variante,
              no en el producto.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setRows((current) => [...current, emptyRow()])}
          >
            + Agregar variante
          </Button>
        </div>

        <div className="mt-4 space-y-3">
          {rows.map((row, index) => (
            <div
              key={row.key}
              className="grid grid-cols-2 items-start gap-3 rounded-xl border border-ink-line/70 p-3 sm:grid-cols-[1fr_1fr_1.2fr_5rem_auto]"
            >
              <input
                type="hidden"
                name={`variant.${index}.id`}
                value={row.id ?? ""}
              />

              <div>
                <input
                  name={`variant.${index}.size`}
                  value={row.size}
                  onChange={(event) =>
                    updateRow(index, { size: event.target.value })
                  }
                  aria-label={`Talle de la variante ${index + 1}`}
                  className={fieldClass}
                  placeholder="Talle"
                />
                <FieldError message={errors[`variant.${index}.size`]} />
              </div>

              <div>
                <input
                  name={`variant.${index}.color`}
                  value={row.color}
                  onChange={(event) =>
                    updateRow(index, { color: event.target.value })
                  }
                  aria-label={`Color de la variante ${index + 1}`}
                  className={fieldClass}
                  placeholder="Color"
                />
                <FieldError message={errors[`variant.${index}.color`]} />
              </div>

              <div>
                <input
                  name={`variant.${index}.sku`}
                  value={row.sku}
                  onChange={(event) =>
                    updateRow(index, { sku: event.target.value })
                  }
                  aria-label={`SKU de la variante ${index + 1}`}
                  className={fieldClass}
                  placeholder="SKU (opcional)"
                />
                <FieldError message={errors[`variant.${index}.sku`]} />
              </div>

              <div>
                <input
                  name={`variant.${index}.stock`}
                  value={row.stock}
                  onChange={(event) =>
                    updateRow(index, { stock: event.target.value })
                  }
                  aria-label={`Stock de la variante ${index + 1}`}
                  inputMode="numeric"
                  className={fieldClass}
                  placeholder="Stock"
                />
                <FieldError message={errors[`variant.${index}.stock`]} />
              </div>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeRow(index)}
                disabled={rows.length === 1}
                aria-label={`Quitar variante ${index + 1}`}
                className="justify-self-end"
              >
                Quitar
              </Button>
            </div>
          ))}

          {rows.length === 0 ? (
            <p className="rounded-xl border border-dashed border-ink-line px-4 py-6 text-center text-xs text-mist">
              Sin variantes el producto se muestra como &ldquo;sin stock&rdquo;.
            </p>
          ) : null}

          <FieldError message={variantsError} />
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-3 border-t border-ink-line/70 pt-6">
        <Button type="submit" disabled={pending}>
          {pending
            ? "Guardando…"
            : product
              ? "Guardar cambios"
              : "Crear producto"}
        </Button>
        <ButtonLink href="/admin/products" variant="ghost" size="sm">
          Cancelar
        </ButtonLink>
      </div>
    </form>
  );
}
