import Link from "next/link";

import { getAdminOverview } from "@/lib/admin-queries";
import { isSupabaseConfigured } from "@/lib/env";

export const dynamic = "force-dynamic";

export default async function AdminHomePage() {
  const overview = await getAdminOverview();

  const stats = [
    { label: "Productos", value: overview.products },
    { label: "Activos", value: overview.activeProducts },
    { label: "Pedidos", value: overview.orders },
    { label: "Por confirmar", value: overview.pendingOrders },
  ];

  return (
    <div className="max-w-4xl">
      <p className="eyebrow">Resumen</p>
      <h1 className="mt-2 text-2xl font-medium tracking-tight">
        Estado de la tienda
      </h1>

      <dl className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-ink-line bg-ink-soft/40 p-5"
          >
            <dt className="font-mono text-[10px] uppercase tracking-[0.18em] text-mist">
              {stat.label}
            </dt>
            <dd className="mt-2 text-3xl font-medium tabular-nums">
              {stat.value}
            </dd>
          </div>
        ))}
      </dl>

      {!isSupabaseConfigured ? (
        <Notice title="Estás viendo datos mock">
          La app corre con el catálogo de <code>src/lib/catalog/mock.ts</code>.
          Pegá tus credenciales de Supabase en <code>.env.local</code> para
          trabajar contra la base real.
        </Notice>
      ) : null}

      {isSupabaseConfigured && !overview.usingServiceRole ? (
        <Notice title="Falta SUPABASE_SERVICE_ROLE_KEY">
          Sin la service role key el panel solo ve productos activos y no puede
          leer pedidos (RLS los bloquea). Agregala en <code>.env.local</code>.
        </Notice>
      ) : null}

      <section className="mt-10">
        <p className="eyebrow">Qué sigue</p>
        <ul className="mt-4 space-y-2 text-sm text-mist">
          <li>
            <Link
              href="/admin/products"
              className="text-bone underline decoration-mist/40 underline-offset-4"
            >
              Revisar el inventario
            </Link>{" "}
            — ya está conectado a tu base.
          </li>
          <li>
            Alta, edición y fotos desde el panel — ya funcionan: abrí un producto
            y subí las suyas.
          </li>
          <li>Carrito + pedido (WhatsApp primero, pago después).</li>
          <li>Categorías administrables (hoy salen del seed).</li>        </ul>
      </section>
    </div>
  );
}

function Notice({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-6 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5 text-sm">
      <p className="font-medium text-amber-200">{title}</p>
      <p className="mt-2 leading-relaxed text-mist">{children}</p>
    </div>
  );
}
