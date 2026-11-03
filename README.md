# Mythic Goods

Storefront + admin scaffold for **Mythic Goods** — clothing and objects with a
unicorn mark: tees, caps, thermos, mugs, jeans, stationery.

The catalog already reads from Supabase. Until you paste credentials it runs
against a local mock catalog, so `npm run dev` works out of the box.

## Stack

| Layer | Choice | Why |
| --- | --- | --- |
| Framework | Next.js 16 (App Router) + TypeScript | Server Components for catalog reads, server actions for the panel |
| Styling | Tailwind CSS 4 | Theme tokens live in `src/app/globals.css` |
| Data | Supabase (Postgres + Storage + RLS) | Free tier, RLS keeps the browser honest |
| Validation | Zod | Installed, ready for the product forms |
| Client state | Zustand | Installed, for the cart that comes next |

Runtime dependencies only — no paid service anywhere in this scaffold.

## Quickstart

```bash
npm install        # already done
npm run dev        # http://localhost:3000
```

Without env vars you get the 8 demo products and the admin panel reports
`Datos mock`. Nothing crashes.

## Connect Supabase

1. Create a project at [supabase.com](https://supabase.com) (free tier).
2. Open **SQL Editor**, paste all of `supabase/migrations/0001_init.sql`, run it.
3. Paste all of `supabase/seed.sql`, run it. You now have 4 categories and 8
   products.
4. **Project Settings → API Keys**: copy the Project URL, the **publishable**
   key and the **secret** key. New projects hand out `sb_publishable_…` and
   `sb_secret_…`; the older `anon` / `service_role` JWTs still work, and the
   legacy ones retire in early 2027, so prefer the new pair.
5. Create `.env.local` in the project root (it is gitignored) and fill in:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<publishable key: sb_publishable_… or legacy anon>
SUPABASE_SERVICE_ROLE_KEY=<secret key: sb_secret_… or legacy service_role>

ADMIN_PASSWORD=<pick a long password>
ADMIN_SESSION_SECRET=<npm run secret>
```

`npm run secret` prints a random 64-char value for `ADMIN_SESSION_SECRET`.

Restart `npm run dev`. The header pill in `/admin` flips from `Datos mock` to
`Supabase` and `/catalog` starts reading real rows.

> `SUPABASE_SERVICE_ROLE_KEY` (the secret key) bypasses RLS. It is only imported
> by `src/lib/supabase/admin.ts`, which is guarded with `server-only`: importing
> it from a Client Component is a build error. Keep it that way.

## Project layout

```
src/
├── app/
│   ├── (shop)/                 # public storefront
│   │   ├── page.tsx            # home: hero + featured + categories
│   │   ├── catalog/page.tsx    # grid + ?categoria= filter
│   │   └── product/[slug]/     # detail with variants
│   ├── admin/                  # password-gated panel
│   │   ├── layout.tsx          # gate + sidebar, shared by every admin page
│   │   ├── page.tsx            # dashboard counters
│   │   ├── products/page.tsx   # inventory table
│   │   └── actions.ts          # login / logout server actions
│   └── layout.tsx              # root layout, metadata, fonts
├── components/
│   ├── brand/unicorn-mark.tsx  # swap this for the real logo
│   ├── shop/                   # header, footer, card, media
│   ├── admin/                  # nav, login form, product form, setup notice
│   └── ui/button.tsx
├── lib/
│   ├── catalog/                # domain types, queries, mock, schema, money
│   ├── supabase/               # client / server / admin clients
│   ├── admin-auth.ts           # password verification (server-only)
│   ├── admin-session.ts        # cookie contract, usable from proxy.ts
│   ├── admin-queries.ts        # panel reads
│   ├── env.ts                  # env access + isSupabaseConfigured
│   └── format.ts               # money + variant labels
├── proxy.ts                    # /admin gate (runs before any render)
└── types/database.ts           # generated from the live database
```

Data flow: pages call `src/lib/catalog/queries.ts` → returns domain types
(`src/lib/catalog/types.ts`) → components never see snake_case rows or
`supabase-js` types.

## The SQL schema, in one screen

- `categories` — slug, name, position.
- `products` — price in **integer cents** (`price_cents`), optional
  `compare_at_cents` for a strikethrough price, `active` flag.
- `product_variants` — size/color/stock. One row per sellable combination, so
  "tee black M" and "tee black L" keep separate stock.
- `product_images` — `storage_path` into the `product-images` bucket.
- `orders` + `order_items` — money in cents, and **snapshot** columns
  (`product_name`, `variant_label`, `unit_price_cents`) so an order still reads
  correctly after you edit a product.

RLS: anonymous visitors can only `SELECT` active catalog rows. `orders` and
`order_items` have **no** policies at all, which means anon is denied; writes go
through server actions with the service_role key.

### Migrations

`supabase/migrations/0001_init.sql` is the baseline. It was applied by hand in
the SQL Editor before this project tracked migrations, so its history entry was
recorded with a marker (`apply_migration` named `0001_init`, containing only a
comment and `select 1`): the deployed schema already matched the file, and
re-running it would only fail on existing tables.

From here on every schema change is a new file in `supabase/migrations/`, applied
through the Supabase MCP server's `apply_migration`, which records it in
`supabase_migrations.schema_migrations`. Compare `list_migrations` with the
folder before trusting either: a local file without a history row is a proposal,
not the schema the panel is talking to.

### Regenerating types

`src/types/database.ts` is generated, never hand-edited: it mirrors whatever the
database currently has, including enum values and foreign keys.

```bash
npx supabase gen types typescript --project-id <ref> --schema public > src/types/database.ts
```

With the Supabase MCP server connected (`pi mcp login supabase`) the same output
comes from its `generate_typescript_types` tool. Re-run it after every
migration, otherwise the panel type-checks against a schema that no longer
exists.

## Admin gate

`/admin` uses one shared password (`ADMIN_PASSWORD`) and an httpOnly cookie
holding `ADMIN_SESSION_SECRET`, valid for 8 hours.

The gate lives in `src/proxy.ts`, **not** in a layout, and that is not a stylistic
choice. A layout receives its `children` already resolved by the router, so an
unauthenticated request still ships the page payload inside the RSC flight data:
the login screen renders, and the inventory ships next to it in the HTML. Proxy
runs before any segment renders, so the data is never serialized. Verified: with
no cookie, `/admin/products` returns a 307 and zero product names.

If you move this gate into a layout you reintroduce that leak.

It is **not** user authentication. Before a second person needs access, replace
`src/lib/admin-auth.ts` with Supabase Auth + an `admin_users` table, keeping the
check in `src/proxy.ts`.

## Loading products from the panel

`/admin/products` is the catalog's front door: **Nuevo producto** creates, the
product name or **Editar** opens the same form, and **Ocultar** flips `active`
(the same flag the shop's RLS policy reads).

- Price is typed in dollars (`18.50` or `18,50`) and stored as integer cents.
  `parseMoneyInput` splits the string on purpose: `18.50 * 100` evaluated as a
  float is 1849.9999999999998 and would save a price one cent short.
- Stock lives in variants — one row per sellable combination. Empty rows are
  ignored. Editing keeps variant ids, so an order that points at a variant still
  resolves; deleting one is safe because `order_items` keeps `product_name`,
  `variant_label` and `unit_price_cents` snapshots.
- The slug follows the name until you edit it by hand, and must match
  `^[a-z0-9]+(-[a-z0-9]+)*$`. A duplicate slug or SKU returns a field error, not
  a raw Postgres message.
- No delete, on purpose: a product row is referenced by historical orders.
  Hiding it is the reversible operation; removing catalog data is its own
  decision.
- Both actions re-check the admin cookie before writing, so a matcher change in
  `src/proxy.ts` cannot turn the panel into an open write endpoint.
- Validation is `src/lib/catalog/schema.ts` (Zod, Spanish messages) and runs
  server-side; the form only renders the returned `fieldErrors`.
- A save writes the product row and then reconciles variants. supabase-js has no
  multi-statement transaction, so a failure in the second step leaves the
  product saved and the variants untouched — re-saving fixes it. Moving this
  into one Postgres function is a known follow-up.

## Photos

The **Fotos** section of the edit page writes into the `product-images` bucket
and the `product_images` table, which the storefront already reads.

- Photos belong to a product that exists: the create form saves first and tells
you to upload on the next screen. A `product_images` row needs `products.id`,
so mixing uploads into the create submit would only move the failure.
- JPG, PNG, WebP or AVIF, at most 5 MB each and 6 per upload
(`src/lib/catalog/images.ts`). Server Actions cap their body at 1 MB by
  default, so `next.config.ts` raises `experimental.serverActions.bodySizeLimit`
to `32mb`; the browser validates the selection first so an oversized upload
fails with a readable message instead of a framework error.
- Each file is stored as `<productId>/<uuid>.<ext>`: the original name is
dropped (accents and spaces make brittle URLs) and the uuid keeps an upload
from colliding with a photo already in the bucket.
- `position` is append-only, so the first photo is the primary one in the
catalog and on the product page. Manual reordering is a separate feature.
- Removing a photo deletes the row first and the object second, and only under
that product's prefix. A failed object removal logs an orphan instead of
leaving a row that points at a missing file. Deleting the object is the one
irreversible step in the panel: that file is the only copy.
- The bucket is public-read with no write policy, so uploads and deletes run
with the service_role key on the server and re-check the admin cookie first.

## Cart and order

The storefront is catalog → cart → WhatsApp. Nothing is charged inside the app.

- The cart is browser state (`src/lib/cart/store.ts`, Zustand + `localStorage`).
  A line is a product + variant pair, so adding the same pair again grows one
  line. Prices in the cart are a display snapshot only.
- `createOrderAction` (`src/app/(shop)/cart/order-actions.ts`) receives just the
  variant ids and quantities. It re-reads price, name, variant label and stock
  from the database with the service_role key, so a visitor editing
  `localStorage` cannot choose what an order costs.
- Orders are written as `pending` with the snapshot columns, and stock is **not**
  decremented: confirmation is manual (Pago Móvil, Zelle, Binance Pay), so an
  abandoned order must not eat inventory. Adjust stock when the payment lands.
- `shipping_cents` stays `0` and the total equals the subtotal; delivery cost is
  agreed in the chat.
- The confirmation page is reachable by the random order id, never by the
  sequential `MG-#####` code, and it is `noindex`.
- `NEXT_PUBLIC_WHATSAPP_NUMBER` holds the shop's number as digits with the
  country code (no `+`, no separators), for example `584121234567`. With it
  unset, the confirmation page explains the missing setting and leaves the order
  summary copyable instead of rendering a dead link.
- Known limits: supabase-js has no transaction, so an order whose item insert
  fails is deleted again immediately; if that cleanup also fails the error is
  logged with the order id, which is the only case a headerless order can
  survive. Nothing rate-limits order creation, which is acceptable while every
  order is confirmed by hand. The confirmation page lists lines alphabetically,
  because `order_items` keeps no position column.

## Venezuela notes (payments come later)

Prices default to `USD` because that is how most local catalogs quote. Payment
rails to wire in this order of cost/complexity: Pago Móvil + Zelle + Binance Pay
(manual confirmation, no fees), then a card processor if volume justifies it.
The scaffold deliberately stops before checkout: `orders.status` starts at
`pending`, which is exactly the shape a manual confirmation flow needs.

## Scripts

```bash
npm run dev      # dev server (Turbopack)
npm run build    # production build
npm run start    # serve the build
npm run lint     # eslint
npm test         # unit tests (compiles two modules, then `node --test`)
npm run secret   # random 64-char value for ADMIN_SESSION_SECRET
```

`tests/` holds the only automated checks: the cart store runs straight from
TypeScript, and the order action is compiled to `tests/build` first because it
imports path aliases and a server-only Supabase client. No test runner was
added: it is `tsc` plus Node's built-in `node:test`.

`.agents/skills/` holds the Supabase agent guidance installed with
`npx skills add supabase/agent-skills`; Pi discovers project skills from there.

## Next steps

1. Category management in the panel (today they come from the seed).
2. Cart (Zustand + localStorage) and order creation.
3. Checkout handoff: WhatsApp deep link first, then Pago Móvil.
4. `revalidate = 60` on catalog pages once the data is stable, replacing
   `dynamic = "force-dynamic"`.
5. Turn `cacheComponents` back on in `next.config.ts` once the data layer is
   settled.
6. Reorder product photos (drag) and edit their `alt` text.
