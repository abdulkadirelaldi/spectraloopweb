/**
 * Minimal in-memory fixed-window rate limiter (no external service).
 *
 * Owned by Security & QA. Consumed by the root `proxy.ts` to throttle the
 * public POST endpoints. Kept dependency-free (no Next imports) and clock-
 * injectable so the algorithm is unit-testable in isolation.
 *
 * ⚠️ Serverless caveat: on Vercel each serverless/edge instance has its own
 * memory, so counters are PER-INSTANCE and reset on cold start. This is a
 * best-effort speed bump against casual abuse/bursts — NOT a globally accurate
 * limiter. For hard, cross-instance guarantees, move to a shared store
 * (e.g. Upstash Redis / @vercel/kv). See report.
 */

export interface RateLimitResult {
  /** Whether this request is within the limit. */
  allowed: boolean;
  /** Configured max requests per window. */
  limit: number;
  /** Requests remaining in the current window (never below 0). */
  remaining: number;
  /** Epoch-ms timestamp when the current window ends and the count resets. */
  resetAt: number;
}

export interface RateLimiterOptions {
  /** Max requests allowed per window. */
  limit: number;
  /** Window length in milliseconds. */
  windowMs: number;
  /** Injectable clock (defaults to Date.now); override in tests. */
  now?: () => number;
  /** Sweep expired entries once the map grows past this size (memory guard). */
  maxKeys?: number;
}

/**
 * Create a rate limiter. Returns a `check(key)` function; call it once per
 * request with a stable client key (e.g. `"<ip>:<path>"`).
 */
export function createRateLimiter({
  limit,
  windowMs,
  now = () => Date.now(),
  maxKeys = 10_000,
}: RateLimiterOptions): (key: string) => RateLimitResult {
  const windows = new Map<string, { count: number; windowStart: number }>();

  const sweep = (t: number) => {
    for (const [key, entry] of windows) {
      if (t - entry.windowStart >= windowMs) windows.delete(key);
    }
  };

  return function check(key: string): RateLimitResult {
    const t = now();
    const entry = windows.get(key);

    // No active window (new key or the previous window has fully elapsed).
    if (!entry || t - entry.windowStart >= windowMs) {
      if (windows.size >= maxKeys) sweep(t);
      windows.set(key, { count: 1, windowStart: t });
      return {
        allowed: true,
        limit,
        remaining: limit - 1,
        resetAt: t + windowMs,
      };
    }

    entry.count += 1;
    return {
      allowed: entry.count <= limit,
      limit,
      remaining: Math.max(0, limit - entry.count),
      resetAt: entry.windowStart + windowMs,
    };
  };
}
