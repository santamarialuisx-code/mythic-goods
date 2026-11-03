import Link from "next/link";

/**
 * Shown instead of a form when the panel has nowhere to write.
 *
 * Mock mode is a feature (the storefront runs before Supabase exists), but a
 * form that always fails on submit would not be.
 */
export function SetupNotice({ missing }: { missing: "supabase" | "service-role" }) {
  return (
    <div className="max-w-xl rounded-2xl border border-amber-400/25 bg-amber-400/5 p-5">
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-amber-300">
        Catálogo no conectado
      </p>
      <p className="mt-2 text-sm leading-relaxed text-bone">
        {missing === "supabase"
          ? "Faltan NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY en .env.local."
          : "Falta SUPABASE_SERVICE_ROLE_KEY en .env.local: el panel escribe con service_role desde el servidor."}
      </p>
      <p className="mt-3 text-xs leading-relaxed text-mist">
        Corré la migración y el seed en Supabase, copiá las tres credenciales y
        reiniciá el servidor. Los pasos están en el README. Mientras tanto la
        tienda sigue andando con el catálogo mock.
      </p>
      <Link
        href="/admin"
        className="mt-4 inline-block text-xs text-mist transition-colors hover:text-bone"
      >
        ← Volver al panel
      </Link>
    </div>
  );
}
