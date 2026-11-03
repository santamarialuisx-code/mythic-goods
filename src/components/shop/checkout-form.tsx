"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";

import { createOrderAction, type CheckoutState } from "@/app/(shop)/cart/order-actions";
import { Button } from "@/components/ui/button";
import { useCartHydrated, useCartStore } from "@/lib/cart/store";
import { formatPrice } from "@/lib/format";

const initialState: CheckoutState = { status: "idle" };

const labelClass =
  "mb-1.5 block font-mono text-[11px] uppercase tracking-[0.18em] text-mist";

const fieldClass =
  "h-11 w-full rounded-xl border border-ink-line bg-ink-soft px-3.5 text-sm text-bone outline-none transition-colors placeholder:text-mist/50 focus:border-iris";

function FieldError({ message }: { message: string | undefined }) {
  if (!message) return null;

  return (
    <p role="alert" className="mt-1.5 text-xs text-red-300">
      {message}
    </p>
  );
}

/**
 * Checkout: contact data plus the cart's product+variant pairs.
 *
 * Only the pairs travel to the server, as JSON in one field. Prices, names and
 * totals are recomputed there from the database, so editing localStorage cannot
 * change what an order costs.
 */
export function CheckoutForm() {
  const router = useRouter();
  const hydrated = useCartHydrated();
  const lines = useCartStore((state) => state.lines);
  const clear = useCartStore((state) => state.clear);
  const [state, formAction, pending] = useActionState(
    createOrderAction,
    initialState,
  );

  const empty = lines.length === 0;
  const currency = lines[0]?.currency ?? "USD";
  const subtotalCents = lines.reduce(
    (total, line) => total + line.unitPriceCents * line.quantity,
    0,
  );

  useEffect(() => {
    if (state.status !== "success") return;

    clear();
    router.push(`/order/${state.orderId}`);
  }, [state, clear, router]);

  if (!hydrated || lines.length === 0) return null;

  const errors = state.status === "error" ? state.fieldErrors : {};
  const payload = JSON.stringify(
    lines.map((line) => ({ variantId: line.variantId, qty: line.quantity })),
  );

  return (
    <section className="mt-12 max-w-2xl border-t border-ink-line/70 pt-8">
      <p className="eyebrow">Datos de contacto</p>
      <p className="mt-1 text-xs leading-relaxed text-mist/70">
        Con esto coordinamos el pago y la entrega por WhatsApp.
      </p>

      <form action={formAction} className="mt-6 space-y-5">
      <input type="hidden" name="items" value={payload} />

      {state.status === "error" ? (
        <p
          role="alert"
          className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200"
        >
          {state.message}
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="customer-name" className={labelClass}>
            Nombre
          </label>
          <input
            id="customer-name"
            name="customerName"
            required
            autoComplete="name"
            className={fieldClass}
            placeholder="Luisa Santamaría"
          />
          <FieldError message={errors.customerName} />
        </div>

        <div>
          <label htmlFor="customer-phone" className={labelClass}>
            Teléfono
          </label>
          <input
            id="customer-phone"
            name="customerPhone"
            required
            inputMode="tel"
            autoComplete="tel"
            className={fieldClass}
            placeholder="0412 1234567"
          />
          <FieldError message={errors.customerPhone} />
        </div>
      </div>

      <div>
        <label htmlFor="customer-notes" className={labelClass}>
          Nota (opcional)
        </label>
        <textarea
          id="customer-notes"
          name="notes"
          rows={3}
          maxLength={500}
          className="w-full rounded-xl border border-ink-line bg-ink-soft px-3.5 py-3 text-sm leading-relaxed text-bone outline-none transition-colors placeholder:text-mist/50 focus:border-iris"
          placeholder="Talle, dirección, cómo coordinamos la entrega."
        />
        <FieldError message={errors.notes} />
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit" disabled={pending || empty}>
          {pending ? "Enviando…" : "Confirmar pedido"}
        </Button>
        <p className="text-sm text-mist">
          Total a coordinar:{" "}
          <span className="text-bone">{formatPrice(subtotalCents, currency)}</span>
        </p>
      </div>

      <p className="text-xs leading-relaxed text-mist/80">
        No se cobra nada acá: el pedido queda reservado y el pago se coordina por
        WhatsApp (Pago Móvil, Zelle o Binance Pay).
      </p>
      </form>
    </section>
  );
}
