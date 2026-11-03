import Link from "next/link";

import { ProductCard } from "@/components/shop/product-card";
import { ButtonLink } from "@/components/ui/button";
import { listCategories, listProducts } from "@/lib/catalog/queries";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [products, categories] = await Promise.all([
    listProducts(),
    listCategories(),
  ]);

  const featured = products.slice(0, 4);

  return (
    <>
      <section className="relative overflow-hidden border-b border-ink-line/70">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(139,123,247,0.20),transparent_55%),radial-gradient(circle_at_85%_30%,rgba(227,200,141,0.12),transparent_50%)]"
        />
        <div className="container-page relative py-20 md:py-28">
          <p className="eyebrow">Nueva colección</p>
          <h1 className="mt-5 max-w-3xl text-4xl leading-[1.05] font-medium tracking-tight text-bone md:text-6xl">
            Lo mítico también
            <br />
            se usa todos los días.
          </h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-mist md:text-lg">
            Ropa, termos, tazas y objetos que no se consiguen en cualquier
            esquina. Hecho de a poco, en cantidades honestas.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-3">
            <ButtonLink href="/catalog">Ver catálogo</ButtonLink>
            <ButtonLink href="/catalog?categoria=ropa" variant="outline">
              Empezar por la ropa
            </ButtonLink>
          </div>
        </div>
      </section>

      <section className="container-page py-16">
        <div className="flex items-end justify-between gap-6">
          <div>
            <p className="eyebrow">Lo que hay</p>
            <h2 className="mt-2 text-2xl font-medium tracking-tight text-bone">
              Destacados
            </h2>
          </div>
          <Link
            href="/catalog"
            className="shrink-0 text-sm text-mist transition-colors hover:text-bone"
          >
            Ver todo →
          </Link>
        </div>

        {featured.length > 0 ? (
          <div className="mt-8 grid grid-cols-2 gap-x-5 gap-y-10 lg:grid-cols-4">
            {featured.map((product, index) => (
              <ProductCard
                key={product.id}
                product={product}
                priority={index < 2}
              />
            ))}
          </div>
        ) : (
          <p className="mt-8 rounded-2xl border border-dashed border-ink-line p-8 text-sm text-mist">
            Todavía no hay productos activos. Cargá el primero desde{" "}
            <Link href="/admin" className="text-bone underline">
              el panel
            </Link>
            .
          </p>
        )}
      </section>

      <section className="container-page pb-20">
        <p className="eyebrow">Categorías</p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/catalog?categoria=${category.slug}`}
              className="group flex items-center justify-between rounded-2xl border border-ink-line bg-ink-soft/40 px-5 py-6 transition-colors hover:border-mist/40"
            >
              <span className="text-base text-bone">{category.name}</span>
              <span className="font-mono text-xs text-mist transition-transform group-hover:translate-x-0.5">
                →
              </span>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
