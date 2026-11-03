"use client";

import { useSyncExternalStore } from "react";
import { create } from "zustand";
import {
  createJSONStorage,
  persist,
  type StateStorage,
} from "zustand/middleware";

import type { CartLine } from "./types";

/**
 * The cart lives in the browser only: Zustand holds it for the session and
 * `persist` writes it to localStorage so a reload keeps it.
 *
 * Identity is product + variant, so adding the same pair twice grows one line
 * instead of creating a second one. Prices here are a display snapshot; the
 * server recomputes them before writing an order.
 */

export type CartState = {
  lines: CartLine[];
  addLine: (line: CartLine) => void;
  setQuantity: (
    productId: string,
    variantId: string,
    quantity: number,
  ) => void;
  removeLine: (productId: string, variantId: string) => void;
  clear: () => void;
};

type PersistedCart = { lines: CartLine[] };

const STORAGE_KEY = "mythic-goods-cart";

/** Keeps a quantity a whole number between 1 and the variant's stock. */
export function clampQuantity(quantity: number, maxQuantity: number) {
  const cap = Math.max(1, Math.trunc(maxQuantity));
  const wanted = Number.isFinite(quantity) ? Math.trunc(quantity) : 1;

  return Math.min(Math.max(wanted, 1), cap);
}

function sameLine(a: CartLine, b: CartLine) {
  return a.productId === b.productId && a.variantId === b.variantId;
}

/**
 * The single place a line enters the cart. An existing product + variant keeps
 * its position and grows, and the newest snapshot wins so a re-added line shows
 * the current name, price and stock.
 */
function putLine(lines: CartLine[], incoming: CartLine): CartLine[] {
  const index = lines.findIndex((line) => sameLine(line, incoming));

  if (index === -1) return [...lines, incoming];

  const existing = lines[index];
  const merged: CartLine = {
    ...incoming,
    quantity: clampQuantity(
      existing.quantity + incoming.quantity,
      incoming.maxQuantity,
    ),
  };

  return lines.map((line, position) => (position === index ? merged : line));
}

/**
 * localStorage is visitor-editable and can hold data from an older build, so
 * nothing it returns is trusted: a line only survives when every field has the
 * shape the cart renders, and the quantity is clamped again.
 */
function toCartLine(value: unknown): CartLine | null {
  if (typeof value !== "object" || value === null) return null;

  const line = value as Record<string, unknown>;

  const valid =
    typeof line.productId === "string" &&
    line.productId.length > 0 &&
    typeof line.variantId === "string" &&
    line.variantId.length > 0 &&
    typeof line.slug === "string" &&
    typeof line.productName === "string" &&
    typeof line.variantLabel === "string" &&
    Number.isSafeInteger(line.unitPriceCents) &&
    (line.unitPriceCents as number) >= 0 &&
    typeof line.currency === "string" &&
    line.currency.length > 0 &&
    (line.imagePath === null || typeof line.imagePath === "string") &&
    Number.isSafeInteger(line.maxQuantity) &&
    (line.maxQuantity as number) > 0 &&
    typeof line.quantity === "number";

  if (!valid) return null;

  return {
    productId: line.productId as string,
    variantId: line.variantId as string,
    slug: line.slug as string,
    productName: line.productName as string,
    variantLabel: line.variantLabel as string,
    unitPriceCents: line.unitPriceCents as number,
    currency: line.currency as string,
    imagePath: line.imagePath as string | null,
    maxQuantity: line.maxQuantity as number,
    quantity: clampQuantity(line.quantity as number, line.maxQuantity as number),
  };
}

function readLines(persisted: unknown): CartLine[] {
  if (typeof persisted !== "object" || persisted === null) return [];

  const raw = (persisted as { lines?: unknown }).lines;
  if (!Array.isArray(raw)) return [];

  return raw.reduce<CartLine[]>((lines, candidate) => {
    const line = toCartLine(candidate);

    return line ? putLine(lines, line) : lines;
  }, []);
}

/**
 * Reading `localStorage` throws instead of returning `null` when storage is
 * blocked (private mode, cookies off). The cart then keeps working in memory
 * for the session instead of breaking the page.
 */
const guardedStorage: StateStorage = {
  getItem: (name) => {
    try {
      return window.localStorage.getItem(name);
    } catch {
      // No storage available: start from an empty cart.
      return null;
    }
  },
  setItem: (name, value) => {
    try {
      window.localStorage.setItem(name, value);
    } catch {
      // The in-memory cart is still valid for this visit.
    }
  },
  removeItem: (name) => {
    try {
      window.localStorage.removeItem(name);
    } catch {
      // Same as setItem: nothing else to recover.
    }
  },
};

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      lines: [],

      addLine: (line) => {
        if (line.maxQuantity < 1) return;
        if (line.quantity < 1) return;

        set((state) => ({ lines: putLine(state.lines, line) }));
      },

      setQuantity: (productId, variantId, quantity) => {
        set((state) => ({
          lines: state.lines.map((line) =>
            line.productId === productId && line.variantId === variantId
              ? { ...line, quantity: clampQuantity(quantity, line.maxQuantity) }
              : line,
          ),
        }));
      },

      removeLine: (productId, variantId) => {
        set((state) => ({
          lines: state.lines.filter(
            (line) =>
              line.productId !== productId || line.variantId !== variantId,
          ),
        }));
      },

      clear: () => {
        set({ lines: [] });
      },
    }),
    {
      name: STORAGE_KEY,
      version: 1,
      storage: createJSONStorage<PersistedCart>(() => guardedStorage),
      partialize: (state) => ({ lines: state.lines }),
      merge: (persisted, current) => ({
        ...current,
        lines: readLines(persisted),
      }),
    },
  ),
);

/** Total number of units in the cart, for the header. */
export const selectTotalUnits = (state: CartState) =>
  state.lines.reduce((total, line) => total + line.quantity, 0);

const subscribeNever = () => () => {};

/**
 * `false` while the server renders and during the hydration render, `true`
 * afterwards.
 *
 * The persisted cart is rehydrated synchronously on the client, so anything
 * read from it would differ from the server HTML and trip a hydration error.
 * Every component that renders cart data reads it behind this flag, which keeps
 * the first client render identical to the server one.
 */
export function useCartHydrated() {
  return useSyncExternalStore(
    subscribeNever,
    () => true,
    () => false,
  );
}
