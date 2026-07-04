import { describe, expect, it } from "vitest";

import { createRateLimiter } from "@/lib/rate-limit";

/** A controllable clock so window behaviour is deterministic. */
function fakeClock(start = 1_000_000) {
  let t = start;
  return {
    now: () => t,
    advance: (ms: number) => {
      t += ms;
    },
  };
}

describe("createRateLimiter", () => {
  it("allows requests up to the limit, then blocks", () => {
    const clock = fakeClock();
    const check = createRateLimiter({
      limit: 3,
      windowMs: 60_000,
      now: clock.now,
    });

    expect(check("ip").allowed).toBe(true); // 1
    expect(check("ip").allowed).toBe(true); // 2
    expect(check("ip").allowed).toBe(true); // 3
    expect(check("ip").allowed).toBe(false); // 4 -> over
  });

  it("reports remaining and resetAt", () => {
    const clock = fakeClock(1_000_000);
    const check = createRateLimiter({
      limit: 2,
      windowMs: 60_000,
      now: clock.now,
    });

    const first = check("ip");
    expect(first).toMatchObject({ allowed: true, limit: 2, remaining: 1 });
    expect(first.resetAt).toBe(1_060_000);

    const second = check("ip");
    expect(second).toMatchObject({ allowed: true, remaining: 0 });

    const third = check("ip");
    expect(third).toMatchObject({ allowed: false, remaining: 0 });
  });

  it("resets after the window elapses", () => {
    const clock = fakeClock();
    const check = createRateLimiter({
      limit: 1,
      windowMs: 60_000,
      now: clock.now,
    });

    expect(check("ip").allowed).toBe(true);
    expect(check("ip").allowed).toBe(false);

    clock.advance(60_000); // window boundary reached -> fresh window
    expect(check("ip").allowed).toBe(true);
  });

  it("tracks keys independently", () => {
    const clock = fakeClock();
    const check = createRateLimiter({
      limit: 1,
      windowMs: 60_000,
      now: clock.now,
    });

    expect(check("a").allowed).toBe(true);
    expect(check("a").allowed).toBe(false);
    // A different key has its own budget.
    expect(check("b").allowed).toBe(true);
  });

  it("sweeps expired entries once maxKeys is exceeded", () => {
    const clock = fakeClock();
    const check = createRateLimiter({
      limit: 5,
      windowMs: 1_000,
      now: clock.now,
      maxKeys: 2,
    });

    check("a");
    check("b");
    clock.advance(1_000); // a and b windows now expired
    // Inserting a 3rd key hits maxKeys and triggers a sweep of expired entries;
    // this must not throw and the new key is admitted.
    expect(check("c").allowed).toBe(true);
  });
});
