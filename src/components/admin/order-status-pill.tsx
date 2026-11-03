import {
  ORDER_STATUS_LABEL,
  ORDER_STATUS_TONE,
  type OrderStatus,
} from "@/lib/orders/status";
import { cn } from "@/lib/utils";

/**
 * The status pill for `/admin/orders`.
 *
 * `ORDER_STATUS_TONE` decides the colour family, so the list and the detail stay
 * in sync with the transition map instead of each picking its own classes.
 */
type Tone = (typeof ORDER_STATUS_TONE)[OrderStatus];

const toneClasses: Record<Tone, string> = {
  waiting: "bg-amber-400/10 text-amber-200",
  progress: "bg-iris/10 text-iris-soft",
  done: "bg-emerald-500/10 text-emerald-300",
  dead: "bg-ink-soft text-red-300",
};

export function OrderStatusPill({
  status,
  className,
}: {
  status: OrderStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "shrink-0 rounded-full px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider",
        toneClasses[ORDER_STATUS_TONE[status]],
        className,
      )}
    >
      {ORDER_STATUS_LABEL[status]}
    </span>
  );
}
