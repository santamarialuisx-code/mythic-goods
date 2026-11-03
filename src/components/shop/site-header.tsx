import Link from "next/link";

import { UnicornMark } from "@/components/brand/unicorn-mark";

const navItems = [
  { href: "/catalog", label: "Todo" },
  { href: "/catalog?categoria=ropa", label: "Ropa" },
  { href: "/catalog?categoria=accesorios", label: "Accesorios" },
  { href: "/catalog?categoria=hogar", label: "Hogar" },
  { href: "/catalog?categoria=papeleria", label: "Papelería" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-ink-line/70 bg-ink/85 backdrop-blur-md">
      <div className="container-page flex h-16 items-center justify-between gap-6">
        <Link href="/" className="flex shrink-0 items-center gap-2.5">
          <UnicornMark className="h-6 w-6 text-gold" />
          <span className="text-[13px] font-medium uppercase tracking-[0.26em] text-bone">
            Mythic Goods
          </span>
        </Link>

        <nav
          aria-label="Catálogo"
          className="flex items-center gap-5 overflow-x-auto text-sm text-mist [scrollbar-width:none]"
        >
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="whitespace-nowrap transition-colors hover:text-bone"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
