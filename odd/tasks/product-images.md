# Product photos

Upload photos from the panel into the `product-images` bucket, attach them to a
product and let the storefront render them. Today the bucket exists and the
public pages already read `product_images`, but nothing writes those rows, so
every product shows the unicorn placeholder.

## Specs

**S1.** The edit page of a product has a "Fotos" section with a file input that
accepts several images at once. Each accepted file is uploaded to the
`product-images` bucket and gets one `product_images` row; `position` is
appended after the highest existing position, so the first photo of a product
stays the primary one.
> "Subida de fotos al bucket desde el panel"
> Roadmap item: "1. Image upload to the `product-images` bucket, wired into the
> product form."

**S2.** Only JPEG, PNG, WebP and AVIF are accepted, at most 5 MB per file and at
most 6 files per upload. A rejected file produces a Spanish message and writes
nothing: no Storage object and no row.

**S3.** Uploading within S2's limits is never rejected by the framework's
default 1 MB Server Action body limit; the limit is raised explicitly in
`next.config.ts` with a comment tying it to S2.

**S4.** Removing a photo deletes its `product_images` row first and its Storage
object second, and only ever touches objects under that product's
`<productId>/` prefix. A failed object removal leaves an orphan file (logged),
never a row that points at a missing file.

**S5.** Every image action re-checks the admin session cookie and refuses to run
without `SUPABASE_SERVICE_ROLE_KEY`, exactly like the product actions: the
`proxy.ts` gate covers the page, not the action endpoint.

**S6.** Photos belong to a product that already exists. The create form explains
that photos are added after the first save instead of offering an input that
cannot work.

**S7.** The storefront shows the first image as the main photo and the next ones
as thumbnails on `/product/<slug>`, and the admin list shows a thumbnail per
product so a missing photo is visible without opening the form.

## Tasks

| ID | Spec | Route | Commit |
| --- | --- | --- | --- |
| T1 | S2, S3 | inline — image limits + file validation helpers (pure) | 1f034d3 |
| T2 | S3 | inline — `bodySizeLimit` in `next.config.ts` | 1f034d3 |
| T3 | S1, S4, S5 | inline — upload/remove server actions | 1f034d3 |
| T4 | S1, S7 | inline — admin reads: images in the form, thumbnail in the list | 1f034d3 |
| T5 | S1, S2, S6 | inline — "Fotos" client section on the edit page | 1abb70f |
| T6 | S1, S6, S7 | inline — list thumbnails, create-mode note | 1abb70f |
| T7 | S1-S7 | inline — README + panel copy, build/lint, E2E against live Supabase | docs commit |

## Log

**L1** (user, verbatim): "continuemos donde lo dejamos, que tenemos pendiente?"

**L2** (user, verbatim, choosing the next slice): "Subida de fotos al bucket
desde el panel".

**L3** (parent decision): photos are uploaded from the edit page, not from the
create form. A `product_images` row needs a `products.id`, so mixing file
uploads into `saveProductAction` would either upload before the product exists
or leave a created product with a broken submit. The create form keeps working
as it does and points to the edit page after saving.

**L4** (parent decision): no manual reordering in this slice. `position` is
append-only, so "the first photo is the primary one" holds without a drag UI.
Reordering is a separate, smaller feature.

**L5** (accepted risk): deleting the Storage object is irreversible — it is the
only copy of the owner's photo. Mitigations: row deleted first, deletion scoped
to the product prefix, and a failed object removal is reported instead of
silently swallowed.

**L6** (constraint, known): the repo has no test runner (no Vitest/Jest/
Playwright). Verification is `npm run build`, `npm run lint`, and a real E2E pass
with ego-browser + MCP inspection of Storage and Postgres, as with the CRUD
slice.

**L7** (parent decision): the bucket is public-read with no anon write policy, so
uploads go through the service_role key on the server. No migration is needed
for this slice.

**L8** (finding, fixed): the "Fotos" section first lived inside the product
form. A `<form>` nested in a `<form>` is dropped by the HTML parser, so the
server-rendered DOM closes the outer form early and the "Subir fotos" button
would submit the product save instead. The section is now a sibling of the
product form on the edit page; measured on the rendered page:
`document.querySelectorAll("form form").length === 0`.

**L9** (evidence, E2E against the live project, dev server on `localhost:3110`):
created "Producto QA Fotos" from the panel (`producto-qa-fotos`, `21,50`,
variant M/Negro/QA-FOTOS-1/stock 3) and uploaded a 400x500 PNG plus a WebP in
one submit → "2 fotos agregadas.", two rows at positions 0 and 1 stored as
`<productId>/<uuid>.<ext>`, two Storage objects with the right mime types.
`/product/producto-qa-fotos` rendered three loaded images (main 213px, two
thumbnails at 119px through the `next/image` optimizer), `/catalog` rendered the
card photo, and the admin list showed the thumbnail. Rejections fired with zero
POST requests: `.txt` → "formato no soportado", 6 MB PNG → "pesa 6,0 MB y el
máximo es 5,0 MB.", empty selection → "Elegí al menos una foto.". Removing the
first photo deleted its row and only its object, the surviving photo became
PRINCIPAL, and removing it left the empty state. Cleanup: QA product deleted,
counts back to 8 products / 17 variants / 0 images / 0 objects,
`/product/producto-qa-fotos` 404 and absent from `/catalog`.

**L10** (commits): `1f034d3` server side (T1-T4), `1abb70f` edit-page UI (T5-T6),
this docs commit (T7).
