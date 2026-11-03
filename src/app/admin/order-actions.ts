"use server";

import { revalidatePath } from "next/cache";

import { hasAdminSession, writeBlockedReason } from "@/lib/admin-write-guard";
import {
  canTransition,
  isOrderStatus,
  statusLabel,
  type OrderStatus,
} from "@/lib/orders/status";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Status changes for `/admin/orders`.
 *
 * The panel is a single-password gate, so the action is the only place that
 * decides what is legal: the browser submits a target status, and the action
 * checks it against the transition map from `@/lib/orders/status` after reading
 * the current one. A button that should not exist cannot be forged into a write.
 */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type OrderActionState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | { status: "success"; message: string };

export async function updateOrderStatusAction(
  _previousState: OrderActionState,
  formData: FormData,
): Promise<OrderActionState> {
  if (!(await hasAdminSession())) {
    return { status: "error", message: "Sesión vencida. Volvé a entrar." };
  }

  const blocked = writeBlockedReason();
  if (blocked) return { status: "error", message: blocked };

  const id = String(formData.get("id") ?? "");
  const target = String(formData.get("status") ?? "");

  if (!UUID.test(id) || !isOrderStatus(target)) {
    return { status: "error", message: "Pedido o estado inválido." };
  }

  const supabase = createAdminClient();

  const { data: order, error } = await supabase
    .from("orders")
    .select("id, code, status")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("[admin] order status read failed:", error.message);
    return { status: "error", message: "No pudimos leer el pedido." };
  }

  if (!order) return { status: "error", message: "Ese pedido no existe." };

  const current = order.status as OrderStatus;

  if (!canTransition(current, target)) {
    return {
      status: "error",
      message: `No se puede pasar de "${statusLabel(current)}" a "${statusLabel(target)}".`,
    };
  }

  const { error: updateError } = await supabase
    .from("orders")
    .update({ status: target })
    .eq("id", id);

  if (updateError) {
    console.error("[admin] order status update failed:", updateError.message);
    return { status: "error", message: "No pudimos cambiar el estado." };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${id}`);

  return {
    status: "success",
    message: `Pedido ${order.code}: ${statusLabel(target)}.`,
  };
}
