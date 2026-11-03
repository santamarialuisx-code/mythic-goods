import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ProductForm } from "@/components/admin/product-form";
import { ProductImages } from "@/components/admin/product-images";
import { SetupNotice } from "@/components/admin/setup-notice";
import {
  getAdminProductForm,
  hasServiceRole,
  listAdminCategories,
} from "@/lib/admin-queries";
import { isSupabaseConfigured } from "@/lib/env";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Editar producto",
  robots: { index: false, follow: false },
};

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (!isSupabaseConfigured) return <SetupNotice missing="supabase" />;
  if (!hasServiceRole()) return <SetupNotice missing="service-role" />;

  const product = await getAdminProductForm(id);

  if (!product) notFound();

  const categories = await listAdminCategories();

  return (
    <div className="max-w-3xl">
      <Link
        href="/admin/products"
        className="text-sm text-mist transition-colors hover:text-bone"
      >
        ← Productos
      </Link>

      <p className="eyebrow mt-6">Inventario</p>
      <h1 className="mt-2 text-2xl font-medium tracking-tight">
        {product.name}
      </h1>
      <p className="mt-1 font-mono text-[10px] text-mist/70">
        /product/{product.slug}
      </p>

      <div className="mt-8">
        <ProductForm categories={categories} product={product} />
      </div>

      {/* Sibling of the form on purpose: a <form> inside the product form is
          flattened by the HTML parser, and its submit button would save the
          product instead of uploading. */}
      <div className="mt-14 border-t border-ink-line/70 pt-10">
        <ProductImages productId={product.id} images={product.images} />
      </div>
    </div>
  );
}
