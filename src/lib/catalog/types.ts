/** Domain types for the storefront and the admin. UI code talks only these. */

export type Category = {
  id: string;
  slug: string;
  name: string;
};

export type ProductImageRef = {
  path: string;
  alt: string | null;
};

export type ProductVariant = {
  id: string;
  size: string | null;
  color: string | null;
  sku: string | null;
  stock: number;
};

export type ProductListItem = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  priceCents: number;
  compareAtCents: number | null;
  currency: string;
  category: { slug: string; name: string } | null;
  primaryImagePath: string | null;
  totalStock: number;
};

export type ProductDetail = ProductListItem & {
  images: ProductImageRef[];
  variants: ProductVariant[];
};
