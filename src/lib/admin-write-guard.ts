import "server-only";

import { cookies } from "next/headers";

import { ADMIN_COOKIE, isAdminSession } from "@/lib/admin-auth";
import { isSupabaseConfigured } from "@/lib/env";

/**
 * Guards for the panel's write path, shared by every server action.
 *
 * `proxy.ts` gates the pages these actions are posted to. A server action is
 * an addressable endpoint on its own, so each one re-checks the session here:
 * the gate covers navigation, not the endpoint.
 */

export async function hasAdminSession() {
  const cookieStore = await cookies();

  return isAdminSession(cookieStore.get(ADMIN_COOKIE)?.value);
}

/** `null` when writes are possible, otherwise the reason to show the owner. */
export function writeBlockedReason() {
  if (!isSupabaseConfigured) {
    return "Conectá Supabase antes de guardar: sin credenciales la tienda corre con el catálogo mock.";
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return "Falta SUPABASE_SERVICE_ROLE_KEY: el catálogo se escribe con service_role desde el servidor.";
  }

  return null;
}
