import Link from "next/link";

import { UnicornMark } from "@/components/brand/unicorn-mark";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-ink-line/70">
      <div className="container-page flex flex-col gap-8 py-12 md:flex-row md:items-start md:justify-between">
        <div className="max-w-xs">
          <div className="flex items-center gap-2.5">
            <UnicornMark className="h-5 w-5 text-gold" />
            <span className="text-[13px] font-medium uppercase tracking-[0.26em]">
              Mythic Goods
            </span>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-mist">
            Ropa, objetos y rarezas con un cuerno por bandera.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-10 text-sm sm:grid-cols-3">
          <div>
            <p className="eyebrow">Tienda</p>
            <ul className="mt-3 space-y-2 text-mist">
              <li>
                <Link href="/catalog" className="hover:text-bone">
                  Catálogo
                </Link>
              </li>
              <li>
                <Link
                  href="/catalog?categoria=ropa"
                  className="hover:text-bone"
                >
                  Ropa
                </Link>
              </li>
              <li>
                <Link
                  href="/catalog?categoria=accesorios"
                  className="hover:text-bone"
                >
                  Accesorios
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="eyebrow">Ayuda</p>
            <ul className="mt-3 space-y-2 text-mist">
              <li>
                <Link href="/catalog" className="hover:text-bone">
                  Envíos
                </Link>
              </li>
              <li>
                <Link href="/catalog" className="hover:text-bone">
                  Cambios
                </Link>
              </li>
              <li>
                <Link href="/catalog" className="hover:text-bone">
                  Contacto
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="eyebrow">Equipo</p>
            <ul className="mt-3 space-y-2 text-mist">
              <li>
                <Link href="/admin" className="hover:text-bone">
                  Panel
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="container-page border-t border-ink-line/70 py-6">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-mist/70">
          © {new Date().getFullYear()} Mythic Goods — Venezuela
        </p>
      </div>
    </footer>
  );
}
