import { whatsappNumber } from "@/lib/env";
import { formatPrice } from "@/lib/format";

import type { OrderSummary } from "./types";

/**
 * The handoff message. It is written once here so the confirmation page and any
 * future retry send the same text.
 */
export function buildWhatsAppText(order: OrderSummary) {
  const lines = order.items.map((item) => {
    const label = item.variantLabel ? ` (${item.variantLabel})` : "";

    return `• ${item.qty} x ${item.productName}${label} — ${formatPrice(item.lineTotalCents, order.currency)}`;
  });

  const blocks = [
    `Hola! Quiero confirmar el pedido ${order.code}.`,
    lines.join("\n"),
    `Total: ${formatPrice(order.totalCents, order.currency)}`,
    `Nombre: ${order.customerName}`,
    `Teléfono: ${order.customerPhone}`,
  ];

  if (order.notes) blocks.push(`Nota: ${order.notes}`);

  return blocks.join("\n\n");
}

/** `null` when the shop has no number configured, so the UI can explain it. */
export function whatsappHref(text: string) {
  if (!whatsappNumber) return null;

  return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(text)}`;
}
