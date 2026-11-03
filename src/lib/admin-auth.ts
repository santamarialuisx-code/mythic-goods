import "server-only";

import { isAdminSessionValue, timingSafeStringEqual } from "./admin-session";

export {
  ADMIN_COOKIE,
  ADMIN_SESSION_MAX_AGE,
  isAdminSessionValue,
} from "./admin-session";

/**
 * Minimal single-password gate for /admin.
 *
 * This is deliberately NOT user auth: one shared password from the env, one
 * httpOnly cookie holding a random secret. Enough to keep the panel off the
 * public internet while the catalog is being loaded. Replace it with Supabase
 * Auth + an `admin_users` table before a second person needs access.
 */

export function isAdminConfigured() {
  return Boolean(
    process.env.ADMIN_PASSWORD && process.env.ADMIN_SESSION_SECRET,
  );
}

export function verifyAdminPassword(password: string) {
  const expected = process.env.ADMIN_PASSWORD;

  if (!expected || !password) return false;

  return timingSafeStringEqual(password, expected);
}

export function isAdminSession(cookieValue: string | undefined) {
  return isAdminSessionValue(cookieValue, process.env.ADMIN_SESSION_SECRET);
}

export function adminSessionToken() {
  return process.env.ADMIN_SESSION_SECRET ?? "";
}
