import { NextResponse, type NextRequest } from "next/server";

import { ADMIN_COOKIE, isAdminSessionValue } from "@/lib/admin-session";

/**
 * Gate for /admin.
 *
 * This has to live in `proxy.ts`, not in a layout: a layout always receives its
 * `children` already resolved, so an unauthenticated response would still carry
 * the page payload inside the RSC flight data. Proxy runs before any segment
 * renders, so the protected data is never serialized.
 *
 * `@/lib/admin-session` is deliberately pure (no `node:*`, no `server-only`) so
 * this file can bundle it safely.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const authed = isAdminSessionValue(
    request.cookies.get(ADMIN_COOKIE)?.value,
    process.env.ADMIN_SESSION_SECRET,
  );

  if (pathname === "/admin/login") {
    return authed
      ? NextResponse.redirect(new URL("/admin", request.url))
      : NextResponse.next();
  }

  return authed
    ? NextResponse.next()
    : NextResponse.redirect(new URL("/admin/login", request.url));
}

export const config = {
  matcher: ["/admin/:path*"],
};
