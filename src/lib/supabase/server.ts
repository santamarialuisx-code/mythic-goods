import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { supabaseAnonKey, supabaseUrl } from "@/lib/env";
import type { Database } from "@/types/database";

/**
 * Server-side client bound to the request cookies, so a logged-in Supabase user
 * (when auth is added) is visible. Still anon-keyed: RLS keeps applying.
 *
 * For privileged work use `createAdminClient()` in `./admin`.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Server Components cannot mutate cookies. Harmless: the session
          // is refreshed wherever it can be set.
        }
      },
    },
  });
}
