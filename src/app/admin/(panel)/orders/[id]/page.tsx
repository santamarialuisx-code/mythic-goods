import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { OrderStatusForm } from "@/components/admin/order-status-form";
import { OrderStatusPill } from "@/components/admin/order-status-pill";
import { SetupNotice } from "@/components/admin/setup-notice";
import { hasServiceRole } from "@/lib/admin-queries";
import { getAdminOrder } from "@/lib/admin-orders";
import { isSupabaseConfigured } from "@/lib/env";
import { formatPrice } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Pedido",
  robots: { index: false, follow: false },
};

const dateFormat = new Intl.DateTimeFormat("es-VE", {
  dateStyle: "short",
  timeStyle: "short",
});

export default async function AdminOrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (!isSupabaseConfigured) return <SetupNotice missing="supabase" />;
  if (!hasServiceRole()) return <SetupNotice missing="service-role" />;

  const order = await getAdminOrder(id);

  // Unknown, malformed and deleted ids are the same 404: an order is retired
  // with `cancelled`, never deleted, so a missing row means a bad link.
  if (!order) notFound();

  return (
    <div className="max-w-3xl">
      <Link
        href="/admin/orders"
        className="text-sm text-mist transition-colors hover:text-bone"
      >
        ← Pedidos
      </Link>

      <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="eyebrow">Pedido</p>
          <h1 className="mt-2 font-mono text-2xl font-medium tracking-tight">
            {order.code}
          </h1>
        </div>
        <div className="flex flex-col items-start gap-2 md:items-end">
          <OrderStatusPill status={order.status} />
          <p className="text-xs text-mist">
            {dateFormat.format(new Date(order.createdAt))}
          </p>
        </div>
      </div>

      <section className="mt-8 rounded-2xl border border-ink-line bg-ink-soft/40 p-4">
        <p className="eyebrow">Contacto</p>
        <p className="mt-2 text-sm text-bone">{order.customerName}</p>
        <p className="mt-0.5 font-mono text-xs text-mist">
          {order.customerPhone}
        </p>
        {order.notes ? (
          <p className="mt-3 text-xs leading-relaxed text-mist">
            Nota: <span className="text-bone">{order.notes}</span>
          </p>
        ) : null}
      </section>

      <section className="mt-6 rounded-2xl border border-ink-line">
        <ul className="divide-y divide-ink-line/60">
          {order.items.map((item, index) => {
            const missingStock =
              item.currentStock !== null && item.currentStock < item.qty;

            return (
              <li
                key={`${item.productName}-${index}`}
                className="px-4 py-3 text-sm"
              >
                <div className="flex items-baseline justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-bone">{item.productName}</p>
                    <p className="mt-0.5 text-xs text-mist">
                      {item.variantLabel ?? "Único"} · {item.qty} u. ·{" "}
                      {formatPrice(item.unitPriceCents, order.currency)} c/u
                    </p>
                  </div>
                  <p className="tabular-nums text-bone">
                    {formatPrice(item.lineTotalCents, order.currency)}
                  </p>
                </div>

                {/* S6: the order never touched stock, so the owner compares it
                    here before adjusting inventory by hand. */}
                {item.currentStock !== null ? (
                  <p
                    className={
                      missingStock
                        ? "mt-2 rounded-lg bg-amber-400/10 px-2.5 py-1.5 text-xs text-amber-200"
                        : "mt-2 text-xs text-mist"
                    }
                  >
                    {missingStock
                      ? `Quedan ${item.currentStock} y el pedido pide ${item.qty}`
                      : `Stock actual: ${item.currentStock}`}
                  </p>
                ) : null}
              </li>
            );
          })}
        </ul>

        <dl className="space-y-2 border-t border-ink-line/60 px-4 py-3 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-mist">Subtotal</dt>
            <dd className="tabular-nums text-bone">
              {formatPrice(order.subtotalCents, order.currency)}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-mist">Envío</dt>
            <dd className="text-mist">
              {order.shippingCents === 0
                ? "A coordinar"
                : formatPrice(order.shippingCents, order.currency)}
            </dd>
          </div>
          <div className="flex justify-between gap-4 pt-1">
            <dt className="text-bone">Total</dt>
            <dd className="tabular-nums text-bone">
              {formatPrice(order.totalCents, order.currency)}
            </dd>
          </div>
        </dl>
      </section>

      <div className="mt-6">
        <OrderStatusForm orderId={order.id} status={order.status} />
      </div>
    </div>
  );
}
