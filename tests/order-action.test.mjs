import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import Module from "node:module";
import path from "node:path";

/**
 * `createOrderAction` is a server action, so the module has no plain-Node entry
 * point: it imports path aliases and a server-only Supabase client. This file
 * stubs those three modules on the loader and drives the real action against an
 * in-memory client whose rows are checked field by field.
 *
 * The action is compiled first: `npx tsc -p tests/tsconfig.json`.
 */

const require = createRequire(import.meta.url);
const BUILD = path.join(import.meta.dirname, "build");
const V = "f199ec7a-0000-4000-8000-000000000001";
const P = "aaaaaaaa-0000-4000-8000-000000000001";
const ORDER_ID = "11111111-2222-3333-4444-555555555555";

let db;
let calls;
let configured = true;

function client() {
  return {
    from(table) {
      const rec = { table, ops: [] };

      const resolve = () => {
        calls.push(rec);
        const ids = (rec.ops.find((op) => op[0] === "in") ?? [])[2] ?? [];

        if (table === "product_variants") {
          return { data: db.variants.filter((v) => ids.includes(v.id)), error: null };
        }

        if (table === "products") {
          return { data: db.products.filter((p) => ids.includes(p.id)), error: null };
        }

        if (rec.ops.some((op) => op[0] === "insert")) {
          return table === "orders"
            ? { data: { id: ORDER_ID, code: "MG-01003" }, error: db.orderError ?? null }
            : { error: db.itemsError ?? null };
        }

        return { error: db.deleteError ?? null };
      };

      const builder = {
        select() {
          rec.ops.push(["select"]);
          return builder;
        },
        insert(row) {
          rec.ops.push(["insert", row]);
          return builder;
        },
        delete() {
          rec.ops.push(["delete"]);
          return builder;
        },
        in(column, values) {
          rec.ops.push(["in", column, values]);
          return builder;
        },
        eq(column, value) {
          rec.ops.push(["eq", column, value]);
          return builder;
        },
        order() {
          return builder;
        },
        single() {
          return builder;
        },
        maybeSingle() {
          return builder;
        },
        then(ok, bad) {
          return Promise.resolve(resolve()).then(ok, bad);
        },
      };

      return builder;
    },
  };
}

const load = Module._load;
Module._load = function (request) {
  if (request === "@/lib/env") {
    return {
      get isSupabaseConfigured() {
        return configured;
      },
      supabaseUrl: "http://stub.invalid",
      supabaseAnonKey: "k",
      whatsappNumber: "584220109369",
    };
  }

  if (request === "@/lib/supabase/admin") return { createAdminClient: client };
  if (request === "@/lib/format") return require(path.join(BUILD, "lib/format.js"));

  return load.apply(this, arguments);
};

process.env.SUPABASE_SERVICE_ROLE_KEY = "stub-service-role";

const { createOrderAction } = require(path.join(BUILD, "app/(shop)/cart/order-actions.js"));

function fresh(overrides = {}) {
  db = {
    variants: [{ id: V, product_id: P, size: null, color: "Negro", stock: 9 }],
    products: [
      { id: P, name: "Gorra Cuerno", price_cents: 1500, currency: "USD", active: true },
    ],
    ...overrides,
  };
  calls = [];
}

const form = (items, fields = {}) => {
  const data = new FormData();
  data.set("items", JSON.stringify(items));
  data.set("customerName", "Luisa Santamaría");
  data.set("customerPhone", "0412 1234567");

  for (const [key, value] of Object.entries(fields)) data.set(key, value);

  return data;
};

const inserted = (table) =>
  calls.filter((call) => call.table === table && call.ops.some((op) => op[0] === "insert"));

const row = (table) => inserted(table)[0].ops.find((op) => op[0] === "insert")[1];

test("client money is ignored and the database price wins", async () => {
  fresh();

  const state = await createOrderAction(
    { status: "idle" },
    form([
      {
        variantId: V,
        qty: 2,
        unitPriceCents: 1,
        lineTotalCents: 1,
        productName: "HACK",
        currency: "EUR",
      },
    ]),
  );

  assert.equal(state.status, "success");

  const order = row("orders");
  assert.deepEqual(
    {
      subtotal: order.subtotal_cents,
      total: order.total_cents,
      shipping: order.shipping_cents,
      currency: order.currency,
      status: order.status,
    },
    { subtotal: 3000, total: 3000, shipping: 0, currency: "USD", status: "pending" },
  );

  const [item] = row("order_items");
  assert.deepEqual(
    {
      name: item.product_name,
      label: item.variant_label,
      qty: item.qty,
      unit: item.unit_price_cents,
      line: item.line_total_cents,
    },
    { name: "Gorra Cuerno", label: "Negro", qty: 2, unit: 1500, line: 3000 },
  );
});

test("short stock, hidden product and deleted variant are refused before any insert", async () => {
  fresh();

  let state = await createOrderAction({ status: "idle" }, form([{ variantId: V, qty: 50 }]));
  assert.equal(state.message, "Quedan 9 de Gorra Cuerno (Negro). Ajustá la cantidad.");

  fresh({
    products: [
      { id: P, name: "Gorra Cuerno", price_cents: 1500, currency: "USD", active: false },
    ],
  });
  state = await createOrderAction({ status: "idle" }, form([{ variantId: V, qty: 1 }]));
  assert.equal(state.message, '"Gorra Cuerno" ya no está disponible. Quitalo del carrito.');

  fresh();
  state = await createOrderAction(
    { status: "idle" },
    form([{ variantId: "99999999-0000-4000-8000-000000000009", qty: 1 }]),
  );
  assert.equal(
    state.message,
    "Una de las variantes ya no existe. Volvé al catálogo y armá el carrito de nuevo.",
  );

  assert.equal(inserted("orders").length + inserted("order_items").length, 0);
});

test("empty cart and oversized cart get their own messages", async () => {
  fresh();

  let state = await createOrderAction({ status: "idle" }, form([]));
  assert.equal(state.message, "El carrito está vacío.");

  const many = Array.from({ length: 31 }, () => ({ variantId: V, qty: 1 }));
  state = await createOrderAction({ status: "idle" }, form(many));
  assert.equal(state.message, "El carrito es demasiado grande: máximo 30 líneas.");
});

test("Spanish field errors and phone normalisation", async () => {
  fresh();

  const invalid = await createOrderAction(
    { status: "idle" },
    form([{ variantId: V, qty: 1 }], { customerName: "a", customerPhone: "abc" }),
  );

  assert.deepEqual(invalid.fieldErrors, {
    customerName: "Poné tu nombre.",
    customerPhone: "Poné un teléfono para coordinar la entrega.",
  });

  fresh();
  await createOrderAction(
    { status: "idle" },
    form([{ variantId: V, qty: 1 }], { customerPhone: "+58 412-1234567" }),
  );

  assert.equal(row("orders").customer_phone, "584121234567");
});

test("mock mode is reported instead of writing", async () => {
  fresh();
  configured = false;

  const state = await createOrderAction({ status: "idle" }, form([{ variantId: V, qty: 1 }]));

  configured = true;

  assert.equal(
    state.message,
    "La tienda corre con el catálogo de prueba: conectá Supabase para recibir pedidos.",
  );
  assert.equal(calls.length, 0);
});

test("a failed items insert deletes the header row it just wrote", async () => {
  fresh({ itemsError: { message: "boom" } });

  const state = await createOrderAction({ status: "idle" }, form([{ variantId: V, qty: 1 }]));

  assert.equal(state.message, "No pudimos guardar el pedido. Probá de nuevo en un rato.");

  const cleanup = calls.find(
    (call) => call.table === "orders" && call.ops.some((op) => op[0] === "delete"),
  );

  assert.ok(cleanup, "the header row must be deleted again");
  assert.ok(cleanup.ops.some((op) => op[0] === "eq" && op[2] === ORDER_ID));
});
