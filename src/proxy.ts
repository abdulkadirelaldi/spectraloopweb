import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { SESSION_COOKIE_NAMES, SIGN_IN_PATH } from "@/lib/auth/constants";
import { createRateLimiter } from "@/lib/rate-limit";

/**
 * Proxy (Next.js 16 renamed `middleware` → `proxy`; Node.js runtime). Next
 * allows only one proxy file, so two concerns live here:
 *
 *  1. Optimistic /panel gate — redirect requests without a session cookie to
 *     the sign-in page. This is a fast, cookie-only presence check (no decode,
 *     no DB). Per the Next.js auth guide + PROGRAM §11 this is NOT the security
 *     boundary: it only pre-filters obvious anonymous traffic and avoids a
 *     flash of the panel. Every panel API route MUST still enforce auth/role via
 *     `requireApiRole` (guard.ts), and panel pages re-check with `auth()`.
 *  2. IP rate limiting for the public POST endpoints — unchanged from 1.Q1.
 *
 * Kept dependency-light on purpose: importing the full `@/lib/auth` (NextAuth +
 * Mongoose) here is both unnecessary for a presence check and problematic in the
 * proxy runtime, so we read the cookie directly.
 */

const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 5;
const RATE_LIMITED_PATHS = new Set(["/api/applications", "/api/contact"]);

const rateLimit = createRateLimiter({
  limit: MAX_REQUESTS_PER_WINDOW,
  windowMs: WINDOW_MS,
});

/** Best-effort client IP from proxy headers (Vercel sets `x-forwarded-for`). */
function clientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

/** Optimistic: does the request carry an Auth.js session cookie at all? */
function hasSessionCookie(request: NextRequest): boolean {
  return SESSION_COOKIE_NAMES.some((name) =>
    Boolean(request.cookies.get(name)),
  );
}

export function proxy(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;

  // 1) Optimistic panel gate. Real authz is enforced in the API routes/pages.
  if (pathname === "/panel" || pathname.startsWith("/panel/")) {
    if (!hasSessionCookie(request)) {
      const signInUrl = new URL(SIGN_IN_PATH, request.nextUrl.origin);
      // Preserve the intended destination so the login page can bounce back.
      signInUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(signInUrl);
    }
    return NextResponse.next();
  }

  // 2) Rate limit public POST submissions (behaviour identical to 1.Q1).
  if (request.method === "POST" && RATE_LIMITED_PATHS.has(pathname)) {
    const key = `${clientIp(request)}:${pathname}`;
    const result = rateLimit(key);

    if (!result.allowed) {
      const retryAfterSeconds = Math.max(
        1,
        Math.ceil((result.resetAt - Date.now()) / 1000),
      );
      return NextResponse.json(
        { ok: false, error: "Too many requests. Please try again shortly." },
        {
          status: 429,
          headers: {
            "Retry-After": String(retryAfterSeconds),
            "RateLimit-Limit": String(result.limit),
            "RateLimit-Remaining": String(result.remaining),
          },
        },
      );
    }
  }

  return NextResponse.next();
}

// Run on the panel routes + the two rate-limited public endpoints.
// (matcher must be a static constant so Next can analyze it at build time.)
export const config = {
  matcher: ["/panel", "/panel/:path*", "/api/applications", "/api/contact"],
};
