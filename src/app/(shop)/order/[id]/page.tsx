import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ButtonLink } from "@/components/ui/button";
import { formatPrice } from "@/lib/format";
import { getOrderSummary } from "@/lib/orders/queries";
import { buildWhatsAppText, whatsappHref } from "@/lib/orders/whatsapp";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Pedido",
  robots: { index: false, follow: false },
};

/**
 * Confirmation page. Reachable by the random order id, never by the sequential
 * `MG-#####` code, so orders cannot be enumerated. Orders have no anon policy,
 * which is why this read goes through the service_role client.
 */
export default async function OrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await getOrderSummary(id);

  if (!order) notFound();

  const text = buildWhatsAppText(order);
  const href = whatsappHref(text);

  return (
    <div className="container-page py-10 md:py-14">
      <Link
        href="/catalog"
        className="text-sm text-mist transition-colors hover:text-bone"
      >
        ← Catálogo
      </Link>

      <div className="mt-6 max-w-2xl">
        <p className="eyebrow">Pedido</p>
        <h1 className="mt-2 text-3xl font-medium tracking-tight md:text-4xl">
          Gracias, {order.customerName.split(" ")[0]}.
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-mist">
          Guardamos tu pedido con el código{" "}
          <span className="font-mono text-bone">{order.code}</span>. El pago se
          coordina por WhatsApp; no cobramos nada en la tienda.
        </p>

        <div className="mt-8 rounded-2xl border border-ink-line">
          <ul className="divide-y divide-ink-line/60">
            {order.items.map((item, index) => (
              <li
                key={`${item.productName}-${index}`}
                className="flex items-baseline justify-between gap-4 px-4 py-3 text-sm"
              >
                <div>
                  <p className="text-bone">{item.productName}</p>
                  <p className="mt-0.5 text-xs text-mist">
                    {item.variantLabel ?? "Único"} · {item.qty} u. ·{" "}
                    {formatPrice(item.unitPriceCents, order.currency)} c/u
                  </p>
                </div>
                <p className="tabular-nums text-bone">
                  {formatPrice(item.lineTotalCents, order.currency)}
                </p>
              </li>
            ))}
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
              <dd className="text-mist">A coordinar</dd>
            </div>
            <div className="flex justify-between gap-4 pt-1">
              <dt className="text-bone">Total</dt>
              <dd className="tabular-nums text-bone">
                {formatPrice(order.totalCents, order.currency)}
              </dd>
            </div>
          </dl>
        </div>

        <div className="mt-6 rounded-2xl border border-ink-line bg-ink-soft px-4 py-3 text-xs leading-relaxed text-mist">
          <p>
            Contacto: <span className="text-bone">{order.customerName}</span> ·{" "}
            <span className="font-mono text-bone">{order.customerPhone}</span>
          </p>
          {order.notes ? (
            <p className="mt-1">
              Nota: <span className="text-bone">{order.notes}</span>
            </p>
          ) : null}
        </div>

        {href ? (
          <div className="mt-8 space-y-3">
            <a
              href={href}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-bone px-6 text-sm font-medium tracking-tight text-ink transition-colors hover:bg-white"
            >
              Enviar el pedido por WhatsApp
            </a>
            <p className="text-xs leading-relaxed text-mist/80">
              Abre el chat con el resumen ya escrito. Si no se abre, copiá el
              texto de abajo y mandalo a mano.
            </p>
          </div>
        ) : (
          <div className="mt-8 rounded-2xl border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-xs leading-relaxed text-amber-100">
            <p className="font-medium text-amber-200">
              La tienda todavía no tiene WhatsApp configurado
            </p>
            <p className="mt-1">
              Guardá el código <span className="font-mono">{order.code}</span> y
              el resumen de abajo: con eso coordinamos el pago por otro canal.
            </p>
          </div>
        )}

        <pre className="mt-6 overflow-x-auto rounded-2xl border border-ink-line bg-ink-soft p-4 font-mono text-[11px] leading-relaxed whitespace-pre-wrap text-mist">
          {text}
        </pre>

        <div className="mt-8">
          <ButtonLink href="/catalog" variant="outline" size="sm">
            Seguir mirando
          </ButtonLink>
        </div>
      </div>
    </div>
  );
}
