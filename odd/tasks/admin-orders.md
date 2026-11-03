# Orders in the panel

The storefront already writes orders; the panel only counts them. This adds the
screen that closes the loop: see the order, move it through confirmation, and
check stock by hand when the payment lands.

## Specs

**S1.** `/admin/orders` lists every order, newest first, with code, date,
customer, item count, total and status, and every row opens its detail. Without
Supabase or without `SUPABASE_SERVICE_ROLE_KEY` it explains what is missing
instead of failing, like the products list.
> "dale" (approving the orders view as the next slice)

**S2.** `/admin/orders/[id]` shows one order: code, date, status, contact and
notes, plus every line with quantity, unit price and line total, and the
subtotal, shipping and total. An unknown or malformed id is a 404.

**S3.** Status changes happen from the detail page through explicit
transitions: `pending → confirmed → paid → shipped → delivered`, plus
`cancelled` from `pending` or `confirmed`. Anything else is refused with a
Spanish message. The action re-checks the admin session and the service_role
key before writing, like every other panel action.

**S4.** `delivered` and `cancelled` are terminal: the detail offers no further
transition for them and the action refuses one if it is submitted anyway.

**S5.** The panel navigation gains "Pedidos", the home count for pending orders
links to the filtered list, and `/admin/orders?estado=<status>` filters by
status. An unknown filter falls back to showing every order.

**S6.** Orders never write inventory on their own. The detail shows the ordered
quantity next to the variant's current stock, so the owner adjusts stock by hand
when the payment lands. This keeps the decision taken for the cart: an order
being created must not silently eat stock.

**S7.** Reads and writes go through the service_role client; `orders` and
`order_items` have no anon policy, so a missing key degrades to the setup
notice instead of an empty table.

## Tasks

| ID | Spec | Route | Commit |
| --- | --- | --- | --- |
| T1 | S1, S2, S7 | parent — `src/lib/admin-orders.ts`: types, list and detail reads | WU1 |
| T2 | S3, S4 | parent — `src/app/admin/order-actions.ts`: transition map and action | WU1 |
| T3 | S1, S5 | worker — orders list page with the status filter | WU2 |
| T4 | S2, S6 | worker — order detail page with lines and the stock check | WU2 |
| T5 | S5 | worker — nav entry and the home link | WU2 |
| T6 | S1-S7 | parent — transition tests, build/lint, E2E against live Supabase | WU3 |

## Log

**L1** (user, verbatim, approving the slice): "dale".

**L2** (parent decision): transitions are an explicit map validated on the
server, not a status field the browser may set. The panel is a single-password
gate, so the action is the only place that can decide what is legal.

**L3** (parent decision): no automatic stock decrement on `paid` (S6). It would
be a second write with no transaction around it, and the cart slice already
decided stock is adjusted by hand when the money lands. The detail page shows
the comparison instead, so the manual step is informed.

**L4** (parent decision): orders are never deleted. `cancelled` is the way to
retire one, which keeps the history and the `MG-#####` sequence meaningful.

**L5** (parent decision): status labels are Spanish in the UI (`pending` =
Pendiente, `confirmed` = Confirmado, `paid` = Pagado, `shipped` = Enviado,
`delivered` = Entregado, `cancelled` = Cancelado); the database keeps the enum.

**L6** (evidence, E2E against the live project with three seeded orders):
`/admin/orders` listed MG-01005 (Pendiente), MG-01006 (Entregado) and MG-01007
(Cancelado) with the six status chips; `?estado=pending` returned only MG-01005
and `?estado=nope` fell back to all three. The detail of MG-01005 showed its
line, `Stock actual: 9` and exactly two buttons (`Confirmar pedido`,
`Marcar como cancelado`).

**L7** (evidence, the transition guard and the walk): forging
`status=paid` on the pending order was refused with `No se puede pasar de
"Pendiente" a "Pagado".` and wrote nothing. Clicking through the real buttons
wrote `confirmed → paid → shipped → delivered`, each step leaving only the next
legal ones, and the database ended at `delivered`. MG-01006 and MG-01007 render
**no** transition button at all. Cleanup: the three orders deleted, counts back
to 8 products / 0 orders / 0 items.

**L8** (commits): `47bb592` status map, reads and action (T1-T2), `56a1e29` list,
detail, form and navigation (T3-T5), this docs commit (T6).

**L9** (known limit): the screens carry no automated test — the repo's harness
covers pure modules only, and `tests/tsconfig.json` includes two non-UI files.
The transition map, which is the part that can corrupt data, does have tests
(`tests/order-status.test.mjs`); the pages are guarded by `tsc`, `lint` and
`build` plus the E2E above.
