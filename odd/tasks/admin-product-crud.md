# Admin product CRUD

Create and edit products (with variants) from `/admin/products`, replacing the
placeholder note that told the owner to type rows into the Supabase Table
Editor. Cart, checkout and image upload stay out of scope.

## Specs

**S1.** `/admin/products` offers create and edit for products; the note that
sends the owner to the Supabase Table Editor is gone.
> "dale con el crud"
> Roadmap item: "1. Product create/edit from `/admin` (Zustand + Zod + service role via server actions)."

Zustand was listed in the roadmap as part of this step; it is not used here.
The form holds no state that outlives its page, so React state is enough.
Zustand stays reserved for the cart (roadmap item 3).

**S2.** Money is stored as integer cents (`price_cents`, `compare_at_cents`) and
typed by the owner as decimal dollars. The parser accepts `.` or `,` as the
decimal separator, at most two decimals, and never uses floating-point math to
build the cents value.

**S3.** Variants are edited as rows (size, color, SKU, stock). Saving reconciles
them: rows with an id are updated, rows without are inserted, existing rows that
were removed from the form are deleted. A variant deleted that way is still
referenced by old orders through `order_items.variant_id on delete set null`
plus the snapshot columns, so no order becomes unreadable.

**S4.** No hard delete. The list exposes activate/deactivate only (`active`),
because a product row is referenced by historical orders and the shop RLS policy
depends on it. Removing catalog data is a deliberate, separate decision.

**S5.** Every mutating action re-checks the admin session cookie before touching
the database, and refuses to run without `SUPABASE_SERVICE_ROLE_KEY`. `proxy.ts`
gates the page; the action check is the defense in depth for the write path.

**S6.** With no Supabase credentials the form is replaced by an explanation
instead of failing on submit — the scaffold's mock-catalog mode stays coherent.

## Tasks

| ID | Spec | Route | Commit |
| --- | --- | --- | --- |
| T1 | S2 | inline — money parse/format helpers, pure | WU1 |
| T2 | S1-S5 | inline — Zod schema + field errors | WU1 |
| T3 | S3, S5 | inline — admin queries (form data, categories) | WU1 |
| T4 | S3, S5, S6 | inline — server actions (save, toggle active) | WU2 |
| T5 | S1, S3 | inline — product form component (client) | WU2 |
| T6 | S1, S6 | inline — new + edit pages, list page links | WU3 |
| T7 | S1 | inline — README/roadmap update + checks | WU3 |

## Log

**L1** (user, verbatim): "hola, quiero que empecemos a trabajar en este proyecto, recuerdas de que trata y como lo empezamos?"

**L2** (user, verbatim): "dale con el crud"

**L3** (parent decision): scaffold committed first as `eae3ea9` so the feature
diff stays reviewable against a base.

**L4** (parent decision): `compare_at_cents` must be `>= price_cents` in the
schema, mirroring the SQL check constraint, so the panel shows a field error
instead of a raw Postgres error.

**L5** (known limit, accepted): supabase-js has no multi-statement transaction,
so a save writes the product row and then reconciles variants. A failure between
those steps leaves the product saved and the variants untouched; the owner can
re-save. Moving the save into one Postgres function is a follow-up, not part of
this slice.
