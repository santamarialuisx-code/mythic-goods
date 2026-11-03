import type { Category, ProductDetail, ProductListItem } from "./types";

/**
 * Local catalog used while `NEXT_PUBLIC_SUPABASE_*` is unset, and by the seed
 * script equivalent in `supabase/seed.sql`. Keep both in sync when you change
 * the demo data.
 */

export const mockCategories: Category[] = [
  { id: "cat-ropa", slug: "ropa", name: "Ropa" },
  { id: "cat-accesorios", slug: "accesorios", name: "Accesorios" },
  { id: "cat-hogar", slug: "hogar", name: "Hogar" },
  { id: "cat-papeleria", slug: "papeleria", name: "Papelería" },
];

const mockCatalog: ProductDetail[] = [
  {
    id: "prod-remera-mythic",
    slug: "remera-mythic",
    name: "Remera Mythic",
    description:
      "Algodón peinado 180 g. Cuerno bordado en el pecho, corte relajado.",
    priceCents: 1800,
    compareAtCents: 2400,
    currency: "USD",
    category: { slug: "ropa", name: "Ropa" },
    primaryImagePath: null,
    totalStock: 18,
    images: [],
    variants: [
      { id: "v-r-1", size: "S", color: "Negro", sku: "MG-REM-S", stock: 4 },
      { id: "v-r-2", size: "M", color: "Negro", sku: "MG-REM-M", stock: 7 },
      { id: "v-r-3", size: "L", color: "Negro", sku: "MG-REM-L", stock: 5 },
      { id: "v-r-4", size: "XL", color: "Negro", sku: "MG-REM-XL", stock: 2 },
    ],
  },
  {
    id: "prod-hoodie-aurora",
    slug: "hoodie-aurora",
    name: "Hoodie Aurora",
    description: "Frisa perchada con capucha forrada. Estampa Aurora en la espalda.",
    priceCents: 4200,
    compareAtCents: null,
    currency: "USD",
    category: { slug: "ropa", name: "Ropa" },
    primaryImagePath: null,
    totalStock: 9,
    images: [],
    variants: [
      { id: "v-h-1", size: "M", color: "Violeta", sku: "MG-HOO-M-VIO", stock: 3 },
      { id: "v-h-2", size: "L", color: "Violeta", sku: "MG-HOO-L-VIO", stock: 4 },
      { id: "v-h-3", size: "L", color: "Negro", sku: "MG-HOO-L-NEG", stock: 2 },
    ],
  },
  {
    id: "prod-jean-nomade",
    slug: "jean-nomade",
    name: "Jean Nómade",
    description: "Denim rígido de tiro alto. Costura dorada en el ruedo.",
    priceCents: 3500,
    compareAtCents: null,
    currency: "USD",
    category: { slug: "ropa", name: "Ropa" },
    primaryImagePath: null,
    totalStock: 5,
    images: [],
    variants: [
      { id: "v-j-1", size: "28", color: "Índigo", sku: "MG-JEA-28", stock: 2 },
      { id: "v-j-2", size: "30", color: "Índigo", sku: "MG-JEA-30", stock: 3 },
      { id: "v-j-3", size: "32", color: "Índigo", sku: "MG-JEA-32", stock: 0 },
    ],
  },
  {
    id: "prod-gorra-cuerno",
    slug: "gorra-cuerno",
    name: "Gorra Cuerno",
    description: "Gabardina con bordado 3D. Cierre metálico ajustable.",
    priceCents: 1500,
    compareAtCents: 1900,
    currency: "USD",
    category: { slug: "accesorios", name: "Accesorios" },
    primaryImagePath: null,
    totalStock: 15,
    images: [],
    variants: [
      { id: "v-g-1", size: "Único", color: "Negro", sku: "MG-GOR-NEG", stock: 9 },
      { id: "v-g-2", size: "Único", color: "Hueso", sku: "MG-GOR-HUE", stock: 6 },
    ],
  },
  {
    id: "prod-tote-mythic",
    slug: "tote-mythic",
    name: "Tote Mythic",
    description: "Lona gruesa 12 oz con bolsillo interno. Aguanta el mercado entero.",
    priceCents: 1100,
    compareAtCents: null,
    currency: "USD",
    category: { slug: "accesorios", name: "Accesorios" },
    primaryImagePath: null,
    totalStock: 8,
    images: [],
    variants: [
      { id: "v-t-1", size: "Único", color: "Hueso", sku: "MG-TOT-HUE", stock: 8 },
    ],
  },
  {
    id: "prod-termo-nebula",
    slug: "termo-nebula",
    name: "Termo Nébulae 900 ml",
    description: "Acero inoxidable de doble pared. 12 h caliente, 24 h frío.",
    priceCents: 2400,
    compareAtCents: 2900,
    currency: "USD",
    category: { slug: "hogar", name: "Hogar" },
    primaryImagePath: null,
    totalStock: 9,
    images: [],
    variants: [
      { id: "v-te-1", size: "Único", color: "Grafito", sku: "MG-TER-GRA", stock: 5 },
      { id: "v-te-2", size: "Único", color: "Hueso", sku: "MG-TER-HUE", stock: 4 },
    ],
  },
  {
    id: "prod-taza-alicornio",
    slug: "taza-alicornio",
    name: "Taza Alicornio",
    description: "Cerámica 350 ml. Se banca el microondas pero no el lavavajillas.",
    priceCents: 1200,
    compareAtCents: null,
    currency: "USD",
    category: { slug: "hogar", name: "Hogar" },
    primaryImagePath: null,
    totalStock: 11,
    images: [],
    variants: [
      { id: "v-ta-1", size: "Único", color: "Hueso", sku: "MG-TAZ-HUE", stock: 11 },
    ],
  },
  {
    id: "prod-cuaderno-onira",
    slug: "cuaderno-onira",
    name: "Cuaderno Onira",
    description: "Punteado, 160 páginas, tapa dura con cierre elástico.",
    priceCents: 900,
    compareAtCents: null,
    currency: "USD",
    category: { slug: "papeleria", name: "Papelería" },
    primaryImagePath: null,
    totalStock: 7,
    images: [],
    variants: [
      { id: "v-c-1", size: "Único", color: "Violeta", sku: "MG-CUA-VIO", stock: 7 },
    ],
  },
];

export function mockProductList(): ProductListItem[] {
  return mockCatalog.map((product) => ({
    id: product.id,
    slug: product.slug,
    name: product.name,
    description: product.description,
    priceCents: product.priceCents,
    compareAtCents: product.compareAtCents,
    currency: product.currency,
    category: product.category,
    primaryImagePath: product.primaryImagePath,
    totalStock: product.totalStock,
  }));
}

export function mockProductBySlug(slug: string) {
  return mockCatalog.find((product) => product.slug === slug) ?? null;
}
