-- ============================================================================
-- Mythic Goods — demo catalog
-- Run after 0001_init.sql. Safe to re-run: every insert is guarded.
-- ============================================================================

insert into public.categories (slug, name, position) values
  ('ropa',       'Ropa',       1),
  ('accesorios', 'Accesorios', 2),
  ('hogar',      'Hogar',      3),
  ('papeleria',  'Papelería',  4)
on conflict (slug) do nothing;

insert into public.products (slug, name, description, category_id, price_cents, compare_at_cents)
values
  (
    'remera-mythic',
    'Remera Mythic',
    'Algodón peinado 180 g. Cuerno bordado en el pecho, corte relajado.',
    (select id from public.categories where slug = 'ropa'),
    1800, 2400
  ),
  (
    'hoodie-aurora',
    'Hoodie Aurora',
    'Frisa perchada con capucha forrada. Estampa Aurora en la espalda.',
    (select id from public.categories where slug = 'ropa'),
    4200, null
  ),
  (
    'jean-nomade',
    'Jean Nómade',
    'Denim rígido de tiro alto. Costura dorada en el ruedo.',
    (select id from public.categories where slug = 'ropa'),
    3500, null
  ),
  (
    'gorra-cuerno',
    'Gorra Cuerno',
    'Gabardina con bordado 3D. Cierre metálico ajustable.',
    (select id from public.categories where slug = 'accesorios'),
    1500, 1900
  ),
  (
    'tote-mythic',
    'Tote Mythic',
    'Lona gruesa 12 oz con bolsillo interno. Aguanta el mercado entero.',
    (select id from public.categories where slug = 'accesorios'),
    1100, null
  ),
  (
    'termo-nebula',
    'Termo Nébulae 900 ml',
    'Acero inoxidable de doble pared. 12 h caliente, 24 h frío.',
    (select id from public.categories where slug = 'hogar'),
    2400, 2900
  ),
  (
    'taza-alicornio',
    'Taza Alicornio',
    'Cerámica 350 ml. Se banca el microondas pero no el lavavajillas.',
    (select id from public.categories where slug = 'hogar'),
    1200, null
  ),
  (
    'cuaderno-onira',
    'Cuaderno Onira',
    'Punteado, 160 páginas, tapa dura con cierre elástico.',
    (select id from public.categories where slug = 'papeleria'),
    900, null
  )
on conflict (slug) do nothing;

insert into public.product_variants (product_id, size, color, stock, position)
select p.id, v.size, v.color, v.stock, v.position
from (values
  ('remera-mythic', 'S',  'Negro',  4, 1),
  ('remera-mythic', 'M',  'Negro',  7, 2),
  ('remera-mythic', 'L',  'Negro',  5, 3),
  ('remera-mythic', 'XL', 'Negro',  2, 4),
  ('hoodie-aurora', 'M',  'Violeta', 3, 1),
  ('hoodie-aurora', 'L',  'Violeta', 4, 2),
  ('hoodie-aurora', 'L',  'Negro',   2, 3),
  ('jean-nomade',   '28', 'Índigo',  2, 1),
  ('jean-nomade',   '30', 'Índigo',  3, 2),
  ('jean-nomade',   '32', 'Índigo',  0, 3),
  ('gorra-cuerno',  'Único', 'Negro',  9, 1),
  ('gorra-cuerno',  'Único', 'Hueso',  6, 2),
  ('tote-mythic',   'Único', 'Hueso',  8, 1),
  ('termo-nebula',  'Único', 'Grafito', 5, 1),
  ('termo-nebula',  'Único', 'Hueso',   4, 2),
  ('taza-alicornio', 'Único', 'Hueso',  11, 1),
  ('cuaderno-onira', 'Único', 'Violeta', 7, 1)
) as v(slug, size, color, stock, position)
join public.products p on p.slug = v.slug
where not exists (
  select 1
  from public.product_variants existing
  where existing.product_id = p.id
    and existing.size = v.size
    and existing.color = v.color
);
