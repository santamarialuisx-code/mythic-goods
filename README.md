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
4. **Project Settings → API**: copy the Project URL, the `anon` key and the
   `service_role` key.
5. Create `.env.local` in the project root (it is gitignored) and fill in:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
SUPABASE_SERVICE_ROLE_KEY=<service_role key>

ADMIN_PASSWORD=<pick a long password>
ADMIN_SESSION_SECRET=<npm run secret>
```

`npm run secret` prints a random 64-char value for `ADMIN_SESSION_SECRET`.

Restart `npm run dev`. The header pill in `/admin` flips from `Datos mock` to
`Supabase` and `/catalog` starts reading real rows.

> `SUPABASE_SERVICE_ROLE_KEY` bypasses RLS. It is only imported by
> `src/lib/supabase/admin.ts`, which is guarded with `server-only`: importing it
> from a Client Component is a build error. Keep it that way.

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
│   ├── admin/                  # nav, login form
│   └── ui/button.tsx
├── lib/
│   ├── catalog/                # domain types, queries, mock, image URLs
│   ├── supabase/               # client / server / admin clients
│   ├── admin-auth.ts           # password verification (server-only)
│   ├── admin-session.ts        # cookie contract, usable from proxy.ts
│   ├── admin-queries.ts        # panel reads
│   ├── env.ts                  # env access + isSupabaseConfigured
│   └── format.ts               # money + variant labels
├── proxy.ts                    # /admin gate (runs before any render)
└── types/database.ts           # hand-written mirror of the SQL schema
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
npm run secret   # random 64-char value for ADMIN_SESSION_SECRET
```

## Next steps

1. Product create/edit from `/admin` (Zustand + Zod + service role via server
   actions).
2. Image upload to the `product-images` bucket.
3. Cart (Zustand + localStorage) and order creation.
4. Checkout handoff: WhatsApp deep link first, then Pago Móvil.
5. `revalidate = 60` on catalog pages once the data is stable, replacing
   `dynamic = "force-dynamic"`.
6. Turn `cacheComponents` back on in `next.config.ts` once the data layer is
   settled.
