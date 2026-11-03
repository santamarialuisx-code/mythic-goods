"use client";

import { useActionState } from "react";

import {
  updateOrderStatusAction,
  type OrderActionState,
} from "@/app/admin/order-actions";
import { Button } from "@/components/ui/button";
import {
  nextStatuses,
  ORDER_STATUS_LABEL,
  type OrderStatus,
} from "@/lib/orders/status";

const initialState: OrderActionState = { status: "idle" };

/**
 * One button per legal transition; the action re-checks the same map on the
 * server, so this component only decides what is worth offering.
 */
function actionLabel(target: OrderStatus) {
  return target === "confirmed"
    ? "Confirmar pedido"
    : `Marcar como ${ORDER_STATUS_LABEL[target].toLocaleLowerCase("es")}`;
}

export function OrderStatusForm({
  orderId,
  status,
}: {
  orderId: string;
  status: OrderStatus;
}) {
  const [state, formAction, pending] = useActionState(
    updateOrderStatusAction,
    initialState,
  );

  const targets = nextStatuses(status);

  // `delivered` and `cancelled` are terminal: nothing left to offer.
  if (targets.length === 0) return null;

  return (
    <form
      action={formAction}
      className="rounded-2xl border border-ink-line bg-ink-soft/40 p-4"
    >
      <input type="hidden" name="id" value={orderId} />

      <p className="eyebrow">Cambiar estado</p>

      <div className="mt-3 flex flex-wrap gap-2">
        {targets.map((target) => (
          <Button
            key={target}
            type="submit"
            name="status"
            value={target}
            size="sm"
            variant={target === "cancelled" ? "outline" : "primary"}
            disabled={pending}
          >
            {actionLabel(target)}
          </Button>
        ))}
      </div>

      {state.status === "error" ? (
        <p role="alert" className="mt-3 text-xs text-red-300">
          {state.message}
        </p>
      ) : null}

      {state.status === "success" ? (
        <p className="mt-3 text-xs text-emerald-300">{state.message}</p>
      ) : null}
    </form>
  );
}
