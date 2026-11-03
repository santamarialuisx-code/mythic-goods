/**
 * Order status: the enum, the Spanish labels and the only legal transitions.
 *
 * This module stays free of `server-only`: the panel renders the labels and the
 * offered buttons from it, and the action validates against the same map, so a
 * button that should not exist cannot be submitted either.
 */

export const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "paid",
  "shipped",
  "delivered",
  "cancelled",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "Pendiente",
  confirmed: "Confirmado",
  paid: "Pagado",
  shipped: "Enviado",
  delivered: "Entregado",
  cancelled: "Cancelado",
};

/** Colour family for the pill, mapped to classes by the component. */
export const ORDER_STATUS_TONE: Record<
  OrderStatus,
  "waiting" | "progress" | "done" | "dead"
> = {
  pending: "waiting",
  confirmed: "progress",
  paid: "done",
  shipped: "progress",
  delivered: "done",
  cancelled: "dead",
};

/**
 * `pending → confirmed → paid → shipped → delivered`, and `cancelled` from the
 * two states where the money is not in yet. `delivered` and `cancelled` are
 * terminal.
 */
export const ORDER_TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["paid", "cancelled"],
  paid: ["shipped"],
  shipped: ["delivered"],
  delivered: [],
  cancelled: [],
};

export function isOrderStatus(value: string): value is OrderStatus {
  return (ORDER_STATUSES as readonly string[]).includes(value);
}

export function nextStatuses(from: OrderStatus): readonly OrderStatus[] {
  return ORDER_TRANSITIONS[from] ?? [];
}

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return nextStatuses(from).includes(to);
}

export function statusLabel(status: string) {
  return isOrderStatus(status) ? ORDER_STATUS_LABEL[status] : status;
}
