-- ============================================================================
-- Mythic Goods — initial schema
-- Run the whole file in Supabase → SQL Editor (or `supabase db push`).
-- Idempotent-safe: it is meant to run once on a fresh project.
-- ============================================================================

create extension if not exists pgcrypto;

-- ----------------------------------------------------------------------------
-- Helpers
-- ----------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ----------------------------------------------------------------------------
-- Catalog
-- ----------------------------------------------------------------------------

create table public.categories (
  id         uuid primary key default gen_random_uuid(),
  slug       text not null unique,
  name       text not null,
  position   integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.products (
  id               uuid primary key default gen_random_uuid(),
  slug             text not null unique,
  name             text not null,
  description      text,
  category_id      uuid references public.categories (id) on delete set null,
  price_cents      integer not null check (price_cents >= 0),
  compare_at_cents integer check (compare_at_cents is null or compare_at_cents >= price_cents),
  currency         text not null default 'USD' check (char_length(currency) = 3),
  active           boolean not null default true,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create table public.product_variants (
  id         uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  sku        text unique,
  size       text,
  color      text,
  stock      integer not null default 0 check (stock >= 0),
  position   integer not null default 0
);

create table public.product_images (
  id           uuid primary key default gen_random_uuid(),
  product_id   uuid not null references public.products (id) on delete cascade,
  storage_path text not null,
  alt          text,
  position     integer not null default 0
);

create index products_active_created_idx on public.products (created_at desc) where active;
create index products_category_idx       on public.products (category_id);
create index product_variants_product_idx on public.product_variants (product_id);
create index product_images_product_idx   on public.product_images (product_id, position);

create trigger products_set_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- Orders
-- Written only from the server with the service_role key: no anon policies.
-- Money is stored in integer cents, never in floating point.
-- ----------------------------------------------------------------------------

create sequence public.order_code_seq start 1000;

create type public.order_status as enum (
  'pending',
  'confirmed',
  'paid',
  'shipped',
  'delivered',
  'cancelled'
);

create table public.orders (
  id               uuid primary key default gen_random_uuid(),
  code             text not null unique
                   default ('MG-' || lpad(nextval('public.order_code_seq')::text, 5, '0')),
  customer_name    text not null,
  customer_phone   text not null,
  customer_email   text,
  shipping_address text,
  notes            text,
  subtotal_cents   integer not null check (subtotal_cents >= 0),
  shipping_cents   integer not null default 0 check (shipping_cents >= 0),
  total_cents      integer not null check (total_cents >= 0),
  currency         text not null default 'USD',
  status           public.order_status not null default 'pending',
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- Snapshot columns (product_name, variant_label, unit_price_cents) are copied at
-- purchase time so an order still reads correctly after a product is edited.
create table public.order_items (
  id               uuid primary key default gen_random_uuid(),
  order_id         uuid not null references public.orders (id) on delete cascade,
  variant_id       uuid references public.product_variants (id) on delete set null,
  product_name     text not null,
  variant_label    text,
  qty              integer not null check (qty > 0),
  unit_price_cents integer not null check (unit_price_cents >= 0),
  line_total_cents integer not null check (line_total_cents >= 0)
);

create index orders_status_created_idx on public.orders (status, created_at desc);
create index order_items_order_idx     on public.order_items (order_id);

create trigger orders_set_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- Row Level Security
-- ----------------------------------------------------------------------------

alter table public.categories       enable row level security;
alter table public.products         enable row level security;
alter table public.product_variants enable row level security;
alter table public.product_images   enable row level security;
alter table public.orders           enable row level security;
alter table public.order_items      enable row level security;

-- Anonymous visitors read the active catalog and nothing else.
create policy "categories are publicly readable"
  on public.categories for select to anon, authenticated
  using (true);

create policy "active products are publicly readable"
  on public.products for select to anon, authenticated
  using (active);

create policy "variants of active products are publicly readable"
  on public.product_variants for select to anon, authenticated
  using (exists (
    select 1 from public.products p
    where p.id = product_id and p.active
  ));

create policy "images of active products are publicly readable"
  on public.product_images for select to anon, authenticated
  using (exists (
    select 1 from public.products p
    where p.id = product_id and p.active
  ));

-- Deliberately no policies on orders / order_items: with RLS enabled and no
-- policy, anon and authenticated are denied. All writes go through server
-- actions using the service_role key (which bypasses RLS). Catalog mutations
-- (insert/update/delete on products & friends) work the same way, from /admin.

-- ----------------------------------------------------------------------------
-- Storage
-- ----------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

create policy "product images are publicly readable"
  on storage.objects for select to anon, authenticated
  using (bucket_id = 'product-images');

-- Uploads are server-side with the service_role key, so no write policy here.
