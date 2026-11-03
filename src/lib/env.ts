/**
 * Public Supabase credentials. `NEXT_PUBLIC_*` variables are inlined at build
 * time, so they must be read with literal `process.env.X` access.
 */
export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/** Storage bucket that holds every product photo. */
export const PRODUCT_IMAGES_BUCKET = "product-images";

/**
 * The shop's WhatsApp number for the order handoff: digits only, country code
 * included, no `+` or separators. Empty when the shop has not configured it,
 * which the confirmation page reports instead of rendering a dead link.
 */
export const whatsappNumber = (
  process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? ""
).replace(/\D/g, "");

/**
 * When false the app runs against the local mock catalog, so `npm run dev`
 * works before Supabase is wired up.
 */
export const isSupabaseConfigured =
  supabaseUrl.length > 0 && supabaseAnonKey.length > 0;
