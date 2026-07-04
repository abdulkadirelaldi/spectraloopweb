import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { createRateLimiter } from "@/lib/rate-limit";

/**
 * Proxy (Next.js 16 renamed `middleware` → `proxy`; defaults to the Node.js
 * runtime). Applies IP-based rate limiting to the public POST endpoints —
 * `/api/applications` and `/api/contact` — WITHOUT touching the route handlers
 * (owned by Backend). On limit exceed it short-circuits with 429 in the same
 * `{ ok: false, error }` JSON shape the routes use.
 *
 * Only POST is throttled here; GETs on these paths (none today) pass through.
 */

// A few requests per minute per IP — enough for a legit form submit + retries,
// low enough to blunt scripted spam. Node.js runtime keeps this Map alive across
// requests within one instance (see rate-limit.ts for the serverless caveat).
const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 5;

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

export function proxy(request: NextRequest): NextResponse {
  // Only throttle state-changing submissions.
  if (request.method !== "POST") return NextResponse.next();

  // Key by IP + path so the two endpoints get independent budgets.
  const key = `${clientIp(request)}:${request.nextUrl.pathname}`;
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

  return NextResponse.next();
}

// Run only on the two public POST endpoints (matcher must be a static constant).
export const config = {
  matcher: ["/api/applications", "/api/contact"],
};
