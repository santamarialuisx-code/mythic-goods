import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

import { LoginForm } from "@/components/admin/login-form";
import { UnicornMark } from "@/components/brand/unicorn-mark";
import { ADMIN_COOKIE, isAdminConfigured, isAdminSession } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Entrar al panel",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage() {
  const cookieStore = await cookies();

  if (isAdminSession(cookieStore.get(ADMIN_COOKIE)?.value)) {
    redirect("/admin");
  }

  return (
    <div className="flex min-h-dvh items-center justify-center px-5 py-16">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2.5">
          <UnicornMark className="h-6 w-6 text-gold" />
          <span className="text-[13px] font-medium uppercase tracking-[0.26em]">
            Mythic Goods
          </span>
        </div>

        <h1 className="mt-8 text-2xl font-medium tracking-tight">Panel</h1>
        <p className="mt-2 text-sm text-mist">Acceso privado del equipo.</p>

        <div className="mt-8">
          {isAdminConfigured() ? <LoginForm /> : <MissingConfig />}
        </div>

        <Link
          href="/"
          className="mt-8 inline-block text-xs text-mist transition-colors hover:text-bone"
        >
          ← Volver a la tienda
        </Link>
      </div>
    </div>
  );
}

function MissingConfig() {
  return (
    <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5 text-sm leading-relaxed">
      <p className="font-medium text-amber-200">Falta configurar el acceso</p>
      <p className="mt-2 text-mist">
        Agregá <code className="text-bone">ADMIN_PASSWORD</code> y{" "}
        <code className="text-bone">ADMIN_SESSION_SECRET</code> en{" "}
        <code className="text-bone">.env.local</code> y reiniciá el servidor.
      </p>
    </div>
  );
}
