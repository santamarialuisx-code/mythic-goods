import type { Metadata } from "next";
import Link from "next/link";

import { ProductForm } from "@/components/admin/product-form";
import { SetupNotice } from "@/components/admin/setup-notice";
import { hasServiceRole, listAdminCategories } from "@/lib/admin-queries";
import { isSupabaseConfigured } from "@/lib/env";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Nuevo producto",
  robots: { index: false, follow: false },
};

export default async function NewProductPage() {
  if (!isSupabaseConfigured) return <SetupNotice missing="supabase" />;
  if (!hasServiceRole()) return <SetupNotice missing="service-role" />;

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
        Nuevo producto
      </h1>

      <div className="mt-8">
        <ProductForm categories={categories} />
      </div>
    </div>
  );
}
