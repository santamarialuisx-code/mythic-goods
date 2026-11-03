import test from "node:test";
import assert from "node:assert/strict";

import {
  clampQuantity,
  selectTotalUnits,
  useCartStore,
} from "../src/lib/cart/store.ts";

/**
 * The cart store has no React in it, so `node --test` exercises it directly
 * (Node strips the TypeScript types). These pin the two invariants the order
 * flow depends on: quantity is always within stock, and one product + variant
 * is always one line.
 */

const line = (overrides = {}) => ({
  productId: "p1",
  variantId: "v1",
  slug: "gorra-cuerno",
  productName: "Gorra Cuerno",
  variantLabel: "Negro",
  unitPriceCents: 1500,
  currency: "USD",
  imagePath: null,
  maxQuantity: 9,
  quantity: 1,
  ...overrides,
});

const store = () => useCartStore.getState();

test("clampQuantity keeps a whole number between 1 and the stock", () => {
  assert.equal(clampQuantity(0, 9), 1);
  assert.equal(clampQuantity(-3, 9), 1);
  assert.equal(clampQuantity(50, 9), 9);
  assert.equal(clampQuantity(2.7, 9), 2);
  assert.equal(clampQuantity(Number.NaN, 9), 1);
  assert.equal(clampQuantity(Number.POSITIVE_INFINITY, 9), 9);
  assert.equal(clampQuantity(Number.NEGATIVE_INFINITY, 9), 1);
  assert.equal(clampQuantity(5, 0), 1);
});

test("same product + variant grows one line, clamped to stock", () => {
  store().clear();

  store().addLine(line({ quantity: 2 }));
  store().addLine(line({ quantity: 3 }));

  assert.equal(store().lines.length, 1);
  assert.equal(store().lines[0].quantity, 5);

  store().addLine(line({ quantity: 9 }));
  assert.equal(store().lines[0].quantity, 9);

  store().addLine(line({ quantity: 1, variantId: "v2" }));
  assert.equal(store().lines.length, 2);
  assert.equal(selectTotalUnits(store()), 10);
});

test("the first add is clamped too, not only the merge", () => {
  store().clear();
  store().addLine(line({ quantity: 50 }));

  assert.equal(store().lines[0].quantity, 9);
});

test("setQuantity clamps and the last unit cannot go to 0", () => {
  store().clear();
  store().addLine(line({ quantity: 2 }));

  store().setQuantity("p1", "v1", 0);
  assert.equal(store().lines[0].quantity, 1);

  store().setQuantity("p1", "v1", 99);
  assert.equal(store().lines[0].quantity, 9);

  store().removeLine("p1", "v1");
  assert.equal(store().lines.length, 0);
});

test("a payload from an older build is validated, merged and re-clamped", async () => {
  globalThis.window = {
    localStorage: {
      getItem: () =>
        JSON.stringify({
          version: 1,
          state: {
            lines: [
              { productId: "p1", variantId: "v1", quantity: 2 },
              line({ quantity: 4 }),
              line({ quantity: 6 }),
              line({ quantity: 0 }),
            ],
          },
        }),
      setItem() {},
      removeItem() {},
    },
  };

  await useCartStore.persist.rehydrate();

  assert.equal(store().lines.length, 1);
  assert.equal(store().lines[0].quantity, 9);
});

test("localStorage that throws leaves the cart working in memory", async () => {
  globalThis.window = {
    localStorage: {
      getItem() {
        throw new Error("blocked");
      },
      setItem() {
        throw new Error("blocked");
      },
      removeItem() {
        throw new Error("blocked");
      },
    },
  };

  await useCartStore.persist.rehydrate();
  store().clear();
  store().addLine(line({ quantity: 2 }));

  assert.equal(selectTotalUnits(store()), 2);
});
