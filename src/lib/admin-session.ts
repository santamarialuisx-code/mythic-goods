/**
 * Session cookie contract for /admin.
 *
 * Imported by middleware, so it must stay free of `node:crypto` and
 * `server-only`: the Edge runtime resolves those differently.
 */

export const ADMIN_COOKIE = "mg_admin";
export const ADMIN_SESSION_MAX_AGE = 60 * 60 * 8; // 8 hours

/** Length-independent comparison: XOR every char, bail if any bit differs. */
export function timingSafeStringEqual(a: string, b: string) {
  if (a.length !== b.length) return false;

  let mismatch = 0;
  for (let index = 0; index < a.length; index += 1) {
    mismatch |= a.charCodeAt(index) ^ b.charCodeAt(index);
  }

  return mismatch === 0;
}

export function isAdminSessionValue(
  cookieValue: string | undefined,
  secret: string | undefined,
) {
  if (!secret || !cookieValue) return false;

  return timingSafeStringEqual(cookieValue, secret);
}
