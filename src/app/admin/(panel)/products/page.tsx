import Link from "next/link";

import { listAdminProducts } from "@/lib/admin-queries";
import { formatPrice } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const products = await listAdminProducts();

  return (
    <div className="max-w-5xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Inventario</p>
          <h1 className="mt-2 text-2xl font-medium tracking-tight">
            Productos
          </h1>
        </div>
        <p className="text-xs text-mist">
          {products.length}{" "}
          {products.length === 1 ? "producto" : "productos"}
        </p>
      </div>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-ink-line">
        <table className="w-full min-w-[640px] border-collapse text-sm">
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
                  <span className="text-bone">{product.name}</span>
                  <span className="ml-2 font-mono text-[10px] text-mist/70">
                    {product.slug}
                  </span>
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
                  <span
                    className={
                      product.active
                        ? "rounded-full bg-emerald-500/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-emerald-300"
                        : "rounded-full bg-ink-soft px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-mist"
                    }
                  >
                    {product.active ? "Activo" : "Oculto"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/product/${product.slug}`}
                    className="text-xs text-mist transition-colors hover:text-bone"
                  >
                    Ver →
                  </Link>
                </td>
              </tr>
            ))}

            {products.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-mist">
                  No hay productos todavía. Cargalos en Supabase o corré el seed.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-xs leading-relaxed text-mist/80">
        Alta y edición desde el panel: próximo paso. Mientras tanto los
        productos se cargan en Supabase → Table Editor, o con{" "}
        <code className="text-mist">supabase/seed.sql</code>.
      </p>
    </div>
  );
}
