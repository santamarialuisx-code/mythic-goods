"use client";

import { createBrowserClient } from "@supabase/ssr";

import { supabaseAnonKey, supabaseUrl } from "@/lib/env";
import type { Database } from "@/types/database";

/**
 * Browser client. Only sees what RLS allows: the active catalog.
 * Never import the service_role key into anything reachable from here.
 */
export function createClient() {
  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
}
