"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const items = [
  { href: "/admin", label: "Resumen" },
  { href: "/admin/products", label: "Productos" },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 md:flex-col">
      {items.map((item) => {
        const active =
          item.href === "/admin"
            ? pathname === "/admin"
            : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "rounded-lg px-3 py-2 text-sm transition-colors",
              active
                ? "bg-ink-soft text-bone"
                : "text-mist hover:bg-ink-soft/60 hover:text-bone",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
