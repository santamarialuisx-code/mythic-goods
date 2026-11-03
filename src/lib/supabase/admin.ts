import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import { supabaseUrl } from "@/lib/env";
import type { Database } from "@/types/database";

/**
 * Service-role client. Bypasses RLS, so it belongs to server code only.
 *
 * `server-only` makes any accidental client import a build error. Use it for
 * catalog mutations and order writes, never for reads the public can do.
 */
export function createAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.",
    );
  }

  return createSupabaseClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
