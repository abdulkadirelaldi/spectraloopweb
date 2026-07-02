import { describe, expect, it } from "vitest";

// Smoke test — proves the Vitest toolchain (TS transform, config, runner) works.
// Real unit tests land alongside this as features arrive.
describe("test infra smoke", () => {
  it("runs a passing assertion", () => {
    expect(1 + 1).toBe(2);
  });

  it("supports async assertions", async () => {
    await expect(Promise.resolve("ok")).resolves.toBe("ok");
  });
});
