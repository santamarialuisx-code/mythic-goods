import test from "node:test";
import assert from "node:assert/strict";

import {
  ORDER_STATUSES,
  canTransition,
  isOrderStatus,
  nextStatuses,
  statusLabel,
} from "../src/lib/orders/status.ts";

/**
 * The transition map is the only thing standing between the panel and an order
 * jumping from `pending` to `delivered`, so it is pinned explicitly.
 */

test("every status has a label", () => {
  const labels = ORDER_STATUSES.map((status) => statusLabel(status));

  assert.equal(labels.length, 6);
  assert.ok(labels.every((label) => label.length > 0));
  assert.deepEqual(labels, [
    "Pendiente",
    "Confirmado",
    "Pagado",
    "Enviado",
    "Entregado",
    "Cancelado",
  ]);
});

test("the happy path only moves forward", () => {
  assert.deepEqual(nextStatuses("pending"), ["confirmed", "cancelled"]);
  assert.deepEqual(nextStatuses("confirmed"), ["paid", "cancelled"]);
  assert.deepEqual(nextStatuses("paid"), ["shipped"]);
  assert.deepEqual(nextStatuses("shipped"), ["delivered"]);
});

test("delivered and cancelled are terminal", () => {
  assert.deepEqual(nextStatuses("delivered"), []);
  assert.deepEqual(nextStatuses("cancelled"), []);

  for (const status of ORDER_STATUSES) {
    assert.equal(canTransition("delivered", status), false);
    assert.equal(canTransition("cancelled", status), false);
  }
});

test("skipped and repeated steps are refused", () => {
  assert.equal(canTransition("pending", "paid"), false);
  assert.equal(canTransition("pending", "shipped"), false);
  assert.equal(canTransition("pending", "pending"), false);
  assert.equal(canTransition("paid", "confirmed"), false);
  assert.equal(canTransition("shipped", "cancelled"), false);
  assert.equal(canTransition("cancelled", "pending"), false);
});

test("only real enum values are accepted as a target", () => {
  assert.equal(isOrderStatus("paid"), true);
  assert.equal(isOrderStatus("PAID"), false);
  assert.equal(isOrderStatus(""), false);
  assert.equal(isOrderStatus("refunded"), false);
  assert.equal(statusLabel("refunded"), "refunded");
});
