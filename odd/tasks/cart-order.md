# Cart and WhatsApp order

Turn the catalog into an order flow: pick a variant, build a cart in the
browser, leave name and phone, and hand the order to WhatsApp with the shop's
chat prefilled. No payment inside the app: confirmation stays manual, which is
what the Venezuela context needs.

## Specs

**S1.** The product page lets the visitor pick a variant (size / color) and a
quantity, then add that exact variant to the cart. With no stock the button is
disabled, and the quantity is capped by that variant's stock.
> "Carrito + pedido por WhatsApp (el flujo completo)"

**S2.** The cart lives in the browser (Zustand + localStorage) and survives a
reload. Adding the same product + variant increases the quantity instead of
creating a second line; every line can change quantity or be removed; the
header shows the total number of units; `/cart` shows the lines, the subtotal
and an empty state that links back to the catalog.

**S3.** Cart totals are a preview only. `createOrder` recomputes every price,
label and line total from the database with the service_role key and ignores
anything the browser claims about price.

**S4.** `createOrder` re-checks that every variant still exists, belongs to an
active product and has enough stock, then writes the order and its lines in one
action with the snapshot columns (`product_name`, `variant_label`,
`unit_price_cents`, `line_total_cents`) and `status = 'pending'`.

**S5.** Checkout asks for name and phone (both required, Spanish field errors)
and an optional note. `shipping_cents` stays `0` because delivery is agreed in
the chat, and the order takes its `MG-#####` code from `order_code_seq`.

**S6.** After a successful order the cart is emptied and the visitor lands on a
confirmation page with the order code, the lines and a WhatsApp deep link
(`https://wa.me/<number>?text=...`) that opens the shop's chat with the order
summary prefilled. The number comes from `NEXT_PUBLIC_WHATSAPP_NUMBER`; with no
number configured the page explains the missing setting instead of offering a
dead link.

**S7.** Stock is not decremented when the order is created. Confirmation is
manual (Pago Móvil, Zelle, Binance Pay), so an abandoned order must not quietly
eat inventory; the order keeps the snapshot and the owner adjusts stock when
the payment lands.

**S8.** With no Supabase credentials the cart still works and checkout explains
that the store runs on the mock catalog and cannot write. A server error keeps
the cart and returns a Spanish message.

## Tasks

| ID | Spec | Route | Commit |
| --- | --- | --- | --- |
| T1 | S2 | worker — cart store (Zustand + persist) | WU1 |
| T2 | S1 | worker — variant picker + add to cart on the product page | WU1 |
| T3 | S2 | worker — `/cart` page and header unit count | WU1 |
| T4 | S3, S4, S5 | parent — `createOrder` action (validation, recompute, snapshots) | WU2 |
| T5 | S5, S6, S8 | parent — checkout form + confirmation page + WhatsApp link | WU2 |
| T6 | S6 | parent — `NEXT_PUBLIC_WHATSAPP_NUMBER`, README | WU2 |
| T7 | S1-S8 | parent — build/lint, E2E against live Supabase | WU3 |

## Log

**L1** (user, verbatim, choosing the slice): "Carrito + pedido por WhatsApp (el
flujo completo)".

**L2** (parent decision): no stock decrement on order creation (S7). The status
starts at `pending` and confirmation is manual, so inventory changes when the
owner confirms, not when a visitor opens WhatsApp and disappears.

**L3** (parent decision): the checkout collects name, phone and an optional
note only. `customer_email` and `shipping_address` stay in the schema for later;
delivery details are agreed in the chat, which is how the shop already works.

**L4** (parent decision): prices are recomputed server-side from
`product_variants` / `products` (S3). A cart in localStorage is editable by the
visitor, so trusting it would let anyone choose their own price.

**L5** (parent decision): `shipping_cents = 0` and the order currency follows the
products (`USD` in the seed). Delivery cost is quoted by chat; pretending to
compute it would be a lie in the order total.

**L6** (open input): the shop's WhatsApp number is not in the repo yet. It has to
land in `.env.local` as `NEXT_PUBLIC_WHATSAPP_NUMBER` (digits with country code,
no `+`), written by the owner because `.env*` writes are blocked for the parent.
Until then the confirmation page explains the missing setting, and the deep link
is verified with a placeholder number.

**L7** (evidence, E2E against the live project, dev server on `localhost:3110`
with `NEXT_PUBLIC_WHATSAPP_NUMBER` exported in the shell): `gorra-cuerno`,
variant Negro (stock 9), added with quantity 2 from the product page → header
showed `Carrito 2`, `/cart` showed `USD 15 c/u` and `USD 30`, and the submitted
payload was `[{"variantId":"f199ec7a-…","qty":2}]` — no price in it. Checkout
with name, phone and note produced order **MG-01001**, redirected to
`/order/644a775f-…`, and the confirmation page offered `wa.me/584220109369` with
the summary prefilled; the cart was empty afterwards (`Carrito 0`). In the
database: `pending`, `subtotal_cents = 3000`, `shipping_cents = 0`, `USD`, and
the line snapshot `Gorra Cuerno x2 @1500 =3000`.

**L8** (evidence, the two things the cart could have let a visitor do): with
`localStorage` edited to `unitPriceCents: 1` the cart rendered `USD 0,01 c/u`, but
the order came out as **MG-01002** with total `USD 15` — the price is recomputed
server-side. With the persisted `quantity: 50` (and a forged `maxQuantity: 50`)
the submit was refused with "Quedan 9 de Gorra Cuerno (Negro). Ajustá la
cantidad.", the page stayed on `/cart`, and no order was written. The database
held exactly two orders (3000 + 1500); both were deleted afterwards and the
counts went back to 8 products / 0 orders / 0 items.

**L9** (open input): `NEXT_PUBLIC_WHATSAPP_NUMBER` still has to be added to
`.env.local` by the owner; the E2E ran with the value exported in the dev shell,
which proves the wiring but is not persistence.

**L10** (commits): `28cceac` cart state and add-to-cart (T1-T3), `4042ed3`
checkout, orders and handoff (T4-T6), this docs commit (T7). One blemish, on
purpose: the `/cart` route lands in the second commit, so the header link in the
first one points at a route that is not there yet.
