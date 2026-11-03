import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

import { logoutAction } from "@/app/admin/actions";
import { AdminNav } from "@/components/admin/admin-nav";
import { UnicornMark } from "@/components/brand/unicorn-mark";
import { ADMIN_COOKIE, isAdminSession } from "@/lib/admin-auth";
import { isSupabaseConfigured } from "@/lib/env";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Panel",
  robots: { index: false, follow: false },
};

/**
 * Chrome for the panel. The real gate is `src/middleware.ts`; this check is the
 * defense in depth for a misconfigured matcher.
 */
export default async function AdminPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();

  if (!isAdminSession(cookieStore.get(ADMIN_COOKIE)?.value)) {
    redirect("/admin/login");
  }

  return (
    <div className="min-h-dvh md:flex">
      <aside className="border-b border-ink-line/70 md:w-60 md:shrink-0 md:border-r md:border-b-0">
        <div className="p-5">
          <Link href="/admin" className="flex items-center gap-2.5">
            <UnicornMark className="h-5 w-5 text-gold" />
            <span className="text-[12px] font-medium uppercase tracking-[0.26em]">
              Panel
            </span>
          </Link>
          <div className="mt-6">
            <AdminNav />
          </div>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="flex items-center justify-between gap-4 border-b border-ink-line/70 px-5 py-3">
          <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-mist">
            <span
              aria-hidden="true"
              className={
                isSupabaseConfigured
                  ? "inline-block h-1.5 w-1.5 rounded-full bg-emerald-400"
                  : "inline-block h-1.5 w-1.5 rounded-full bg-amber-400"
              }
            />
            {isSupabaseConfigured ? "Supabase" : "Datos mock"}
          </p>

          <div className="flex items-center gap-4 text-xs">
            <Link href="/" className="text-mist transition-colors hover:text-bone">
              Ver tienda
            </Link>
            <form action={logoutAction}>
              <button
                type="submit"
                className="text-mist transition-colors hover:text-bone"
              >
                Salir
              </button>
            </form>
          </div>
        </header>

        <div className="p-5 md:p-8">{children}</div>
      </div>
    </div>
  );
}
