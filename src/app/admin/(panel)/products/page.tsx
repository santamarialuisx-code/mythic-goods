import Image from "next/image";
import Link from "next/link";

import { setProductActiveAction } from "@/app/admin/product-actions";
import { ButtonLink } from "@/components/ui/button";
import { hasServiceRole, listAdminProducts, type AdminProductRow } from "@/lib/admin-queries";
import { productImageUrl } from "@/lib/catalog/images";
import { isSupabaseConfigured } from "@/lib/env";
import { formatPrice } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const products = await listAdminProducts();
  const canWrite = isSupabaseConfigured && hasServiceRole();

  return (
    <div className="max-w-5xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Inventario</p>
          <h1 className="mt-2 text-2xl font-medium tracking-tight">
            Productos
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <p className="text-xs text-mist">
            {products.length} {products.length === 1 ? "producto" : "productos"}
          </p>
          {canWrite ? (
            <ButtonLink href="/admin/products/new" size="sm">
              Nuevo producto
            </ButtonLink>
          ) : null}
        </div>
      </div>

      <div className="mt-6 hidden overflow-x-auto rounded-2xl border border-ink-line md:block">
        <table className="w-full min-w-[720px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-ink-line text-left">
              {["Producto", "Categoría", "Precio", "Stock", "Estado", ""].map(
                (heading) => (
                  <th
                    key={heading}
                    className="px-4 py-3 font-mono text-[10px] font-normal uppercase tracking-[0.16em] text-mist"
                  >
                    {heading}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr
                key={product.id}
                className="border-b border-ink-line/60 last:border-0"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-ink-line bg-ink-soft">
                      {product.primaryImagePath ? (
                        <Image
                          src={productImageUrl(product.primaryImagePath)}
                          alt=""
                          fill
                          sizes="40px"
                          className="object-cover"
                        />
                      ) : (
                        <span className="flex h-full items-center justify-center font-mono text-[9px] text-mist/50">
                          —
                        </span>
                      )}
                    </div>
                    <div>
                      {canWrite ? (
                        <Link
                          href={`/admin/products/${product.id}`}
                          className="text-bone transition-colors hover:text-gold"
                        >
                          {product.name}
                        </Link>
                      ) : (
                        <span className="text-bone">{product.name}</span>
                      )}
                      <span className="ml-2 font-mono text-[10px] text-mist/70">
                        {product.slug}
                      </span>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-mist">
                  {product.categoryName ?? "—"}
                </td>
                <td className="px-4 py-3 tabular-nums text-bone">
                  {formatPrice(product.priceCents, product.currency)}
                </td>
                <td className="px-4 py-3 tabular-nums">
                  <span
                    className={
                      product.totalStock > 0 ? "text-bone" : "text-red-300"
                    }
                  >
                    {product.totalStock}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <StatusPill active={product.active} />
                </td>
                <td className="px-4 py-3">
                  <ProductActions product={product} canWrite={canWrite} />
                </td>
              </tr>
            ))}

            {products.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-mist">
                  No hay productos todavía.{" "}
                  {canWrite
                    ? "Creá el primero."
                    : "Corré supabase/seed.sql o conectá Supabase."}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {/* Below md the table would need horizontal scrolling to reach the price,
          the stock and the actions, so the same rows render as cards instead. */}
      <ul className="mt-6 divide-y divide-ink-line/60 rounded-2xl border border-ink-line md:hidden">
        {products.map((product) => (
          <li key={product.id} className="flex gap-3 p-4">
            <div className="relative h-16 w-14 shrink-0 overflow-hidden rounded-lg border border-ink-line bg-ink-soft">
              {product.primaryImagePath ? (
                <Image
                  src={productImageUrl(product.primaryImagePath)}
                  alt=""
                  fill
                  sizes="56px"
                  className="object-cover"
                />
              ) : (
                <span className="flex h-full items-center justify-center font-mono text-[9px] text-mist/50">
                  —
                </span>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  {canWrite ? (
                    <Link
                      href={`/admin/products/${product.id}`}
                      className="text-sm text-bone"
                    >
                      {product.name}
                    </Link>
                  ) : (
                    <span className="text-sm text-bone">{product.name}</span>
                  )}
                  <p className="mt-0.5 truncate font-mono text-[10px] text-mist/70">
                    {product.slug}
                  </p>
                </div>
                <StatusPill active={product.active} />
              </div>

              <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-xs text-mist">
                <span className="tabular-nums text-bone">
                  {formatPrice(product.priceCents, product.currency)}
                </span>
                <span
                  className={
                    product.totalStock > 0
                      ? "tabular-nums"
                      : "tabular-nums text-red-300"
                  }
                >
                  {product.totalStock} u.
                </span>
                <span>{product.categoryName ?? "Sin categoría"}</span>
              </div>

              <ProductActions
                product={product}
                canWrite={canWrite}
                className="mt-3 justify-start"
              />
            </div>
          </li>
        ))}

        {products.length === 0 ? (
          <li className="px-4 py-10 text-center text-mist">
            No hay productos todavía.
          </li>
        ) : null}
      </ul>

      <p className="mt-4 text-xs leading-relaxed text-mist/80">
        {canWrite ? (
          <>
            El precio se escribe en dólares y se guarda en centavos enteros. El
            stock vive en las variantes: un producto sin variantes se muestra
            sin stock.
          </>
        ) : (
          <>
            Sin Supabase el panel lee el catálogo mock y no puede escribir. Los
            pasos para conectar la base están en el README.
          </>
        )}
      </p>
    </div>
  );
}

function StatusPill({ active }: { active: boolean }) {
  return (
    <span
      className={
        active
          ? "shrink-0 rounded-full bg-emerald-500/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-emerald-300"
          : "shrink-0 rounded-full bg-ink-soft px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-mist"
      }
    >
      {active ? "Activo" : "Oculto"}
    </span>
  );
}

function ProductActions({
  product,
  canWrite,
  className = "justify-end",
}: {
  product: AdminProductRow;
  canWrite: boolean;
  className?: string;
}) {
  return (
    <div className={`flex items-center gap-4 ${className}`}>
      {canWrite ? (
        <>
          <form action={setProductActiveAction}>
            <input type="hidden" name="id" value={product.id} />
            <input
              type="hidden"
              name="active"
              value={product.active ? "false" : "true"}
            />
            <button
              type="submit"
              className="text-xs text-mist transition-colors hover:text-bone"
            >
              {product.active ? "Ocultar" : "Activar"}
            </button>
          </form>
          <Link
            href={`/admin/products/${product.id}`}
            className="text-xs text-mist transition-colors hover:text-bone"
          >
            Editar
          </Link>
        </>
      ) : null}
      <Link
        href={`/product/${product.slug}`}
        className="text-xs text-mist transition-colors hover:text-bone"
      >
        Ver →
      </Link>
    </div>
  );
}
