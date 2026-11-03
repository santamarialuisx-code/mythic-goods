import Link from "next/link";

import { OrderStatusPill } from "@/components/admin/order-status-pill";
import { SetupNotice } from "@/components/admin/setup-notice";
import { hasServiceRole } from "@/lib/admin-queries";
import { listAdminOrders, type AdminOrderRow } from "@/lib/admin-orders";
import { isSupabaseConfigured } from "@/lib/env";
import { formatPrice } from "@/lib/format";
import {
  isOrderStatus,
  ORDER_STATUSES,
  ORDER_STATUS_LABEL,
  type OrderStatus,
} from "@/lib/orders/status";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const dateFormat = new Intl.DateTimeFormat("es-VE", { dateStyle: "short" });

function formatOrderDate(createdAt: string) {
  return dateFormat.format(new Date(createdAt));
}

function formatItemCount(count: number) {
  return count === 1 ? "1 ítem" : `${count} ítems`;
}

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string | string[] }>;
}) {
  if (!isSupabaseConfigured) return <SetupNotice missing="supabase" />;
  if (!hasServiceRole()) return <SetupNotice missing="service-role" />;

  const params = await searchParams;
  const rawStatus = params.estado;

  // A repeated `?estado=` arrives as an array and an unknown value is not a
  // status: both fall back to every order instead of an empty list.
  const status =
    typeof rawStatus === "string" && isOrderStatus(rawStatus)
      ? rawStatus
      : undefined;

  const orders = await listAdminOrders(status);

  return (
    <div className="max-w-5xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Ventas</p>
          <h1 className="mt-2 text-2xl font-medium tracking-tight">Pedidos</h1>
        </div>
        <p className="text-xs text-mist">
          {orders.length} {orders.length === 1 ? "pedido" : "pedidos"}
          {status ? ` en ${ORDER_STATUS_LABEL[status]}` : ""}
        </p>
      </div>

      <nav
        aria-label="Filtrar por estado"
        className="mt-6 flex flex-wrap gap-2"
      >
        <FilterChip href="/admin/orders" active={!status}>
          Todos
        </FilterChip>
        {ORDER_STATUSES.map((value) => (
          <FilterChip
            key={value}
            href={`/admin/orders?estado=${value}`}
            active={value === status}
          >
            {ORDER_STATUS_LABEL[value]}
          </FilterChip>
        ))}
      </nav>

      <div className="mt-6 hidden overflow-x-auto rounded-2xl border border-ink-line md:block">
        <table className="w-full min-w-[760px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-ink-line text-left">
              {["Código", "Fecha", "Cliente", "Ítems", "Total", "Estado", ""].map(
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
            {orders.map((order) => (
              <tr
                key={order.id}
                className="border-b border-ink-line/60 last:border-0"
              >
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/orders/${order.id}`}
                    className="font-mono text-xs text-bone transition-colors hover:text-gold"
                  >
                    {order.code}
                  </Link>
                </td>
                <td className="px-4 py-3 text-mist">
                  {formatOrderDate(order.createdAt)}
                </td>
                <td className="px-4 py-3">
                  <span className="text-bone">{order.customerName}</span>
                  <span className="mt-0.5 block font-mono text-[10px] text-mist/70">
                    {order.customerPhone}
                  </span>
                </td>
                <td className="px-4 py-3 tabular-nums text-mist">
                  {order.itemCount}
                </td>
                <td className="px-4 py-3 tabular-nums text-bone">
                  {formatPrice(order.totalCents, order.currency)}
                </td>
                <td className="px-4 py-3">
                  <OrderStatusPill status={order.status} />
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/orders/${order.id}`}
                    className="text-xs text-mist transition-colors hover:text-bone"
                  >
                    Ver →
                  </Link>
                </td>
              </tr>
            ))}

            {orders.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-mist">
                  <EmptyOrders status={status} />
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {/* Below md seven columns would need horizontal scrolling to reach the
          total and the status, so the same orders render as cards instead. */}
      <ul className="mt-6 divide-y divide-ink-line/60 rounded-2xl border border-ink-line md:hidden">
        {orders.map((order) => (
          <OrderCard key={order.id} order={order} />
        ))}

        {orders.length === 0 ? (
          <li className="px-4 py-10 text-center text-sm text-mist">
            <EmptyOrders status={status} />
          </li>
        ) : null}
      </ul>

      <p className="mt-4 text-xs leading-relaxed text-mist/80">
        Los pedidos no descuentan stock: al confirmar el pago, ajustá el
        inventario a mano desde la ficha de cada producto.
      </p>
    </div>
  );
}

function FilterChip({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "rounded-full border px-4 py-2 text-sm transition-colors",
        active
          ? "border-bone bg-bone text-ink"
          : "border-ink-line text-mist hover:border-mist/50 hover:text-bone",
      )}
    >
      {children}
    </Link>
  );
}

function OrderCard({ order }: { order: AdminOrderRow }) {
  return (
    <li className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link
            href={`/admin/orders/${order.id}`}
            className="font-mono text-xs text-bone"
          >
            {order.code}
          </Link>
          <p className="mt-0.5 text-[11px] text-mist">
            {formatOrderDate(order.createdAt)}
          </p>
        </div>
        <OrderStatusPill status={order.status} />
      </div>

      <p className="mt-3 truncate text-sm text-bone">{order.customerName}</p>

      <div className="mt-1 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 text-xs text-mist">
        <span>{formatItemCount(order.itemCount)}</span>
        <span className="tabular-nums text-bone">
          {formatPrice(order.totalCents, order.currency)}
        </span>
      </div>

      <Link
        href={`/admin/orders/${order.id}`}
        className="mt-3 inline-block text-xs text-mist transition-colors hover:text-bone"
      >
        Ver el pedido →
      </Link>
    </li>
  );
}

/** Two different voids: no orders at all, or none in the selected status. */
function EmptyOrders({ status }: { status?: OrderStatus }) {
  if (!status) {
    return (
      <>
        Todavía no hay pedidos. Cuando alguien compre desde la tienda, va a
        aparecer acá.
      </>
    );
  }

  return (
    <>
      No hay pedidos en {ORDER_STATUS_LABEL[status]}.{" "}
      <Link
        href="/admin/orders"
        className="text-bone underline decoration-mist/40 underline-offset-4"
      >
        Ver todos
      </Link>
    </>
  );
}
