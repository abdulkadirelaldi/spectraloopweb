import { describe, expect, it } from "vitest";

import {
  firstErrorMessage,
  panelApplicationStatusSchema,
  panelExpenseCreateSchema,
  panelExpenseUpdateSchema,
  panelInventoryCreateSchema,
  panelInventoryUpdateSchema,
  panelSponsorCreateSchema,
  panelSponsorUpdateSchema,
} from "@/lib/validation";

const ISO = "2026-08-01T10:00:00.000Z";

describe("panel inventory schemas", () => {
  const valid = {
    name: "Cam elyaf",
    category: "Malzeme",
    unit: "adet",
    quantity: 5,
  };

  it("accepts a valid create and defaults status to available", () => {
    expect(panelInventoryCreateSchema.parse(valid).status).toBe("available");
  });

  it("requires name, category, unit", () => {
    for (const k of ["name", "category", "unit"] as const) {
      const body: Record<string, unknown> = { ...valid };
      delete body[k];
      expect(panelInventoryCreateSchema.safeParse(body).success).toBe(false);
    }
  });

  it("rejects a negative quantity and one over 1,000,000", () => {
    expect(
      panelInventoryCreateSchema.safeParse({ ...valid, quantity: -1 }).success,
    ).toBe(false);
    expect(
      panelInventoryCreateSchema.safeParse({ ...valid, quantity: 1_000_001 })
        .success,
    ).toBe(false);
  });

  it("allows quantity 0 and a fractional quantity", () => {
    expect(
      panelInventoryCreateSchema.safeParse({ ...valid, quantity: 0 }).success,
    ).toBe(true);
    expect(
      panelInventoryCreateSchema.safeParse({ ...valid, quantity: 2.5 }).success,
    ).toBe(true);
  });

  it("rejects an invalid status enum and over-length name (>200)", () => {
    expect(
      panelInventoryCreateSchema.safeParse({ ...valid, status: "lost" })
        .success,
    ).toBe(false);
    expect(
      panelInventoryCreateSchema.safeParse({ ...valid, name: "a".repeat(201) })
        .success,
    ).toBe(false);
  });

  it("update: partial ok, empty rejected, clearable notes via null", () => {
    expect(panelInventoryUpdateSchema.safeParse({ quantity: 3 }).success).toBe(
      true,
    );
    expect(panelInventoryUpdateSchema.safeParse({ notes: null }).success).toBe(
      true,
    );
    const empty = panelInventoryUpdateSchema.safeParse({});
    expect(empty.success).toBe(false);
    if (!empty.success)
      expect(firstErrorMessage(empty.error)).toBe(
        "No updatable fields provided.",
      );
  });
});

describe("panel expense schemas", () => {
  const valid = {
    title: "Kablo seti",
    amount: 250,
    category: "Elektronik",
    date: ISO,
  };

  it("accepts a valid create, defaults currency to TRY, coerces date", () => {
    const parsed = panelExpenseCreateSchema.parse(valid);
    expect(parsed.currency).toBe("TRY");
    expect(parsed.date).toBeInstanceOf(Date);
  });

  it("rejects amount <= 0 and over 100,000,000", () => {
    expect(
      panelExpenseCreateSchema.safeParse({ ...valid, amount: 0 }).success,
    ).toBe(false);
    expect(
      panelExpenseCreateSchema.safeParse({ ...valid, amount: -5 }).success,
    ).toBe(false);
    expect(
      panelExpenseCreateSchema.safeParse({ ...valid, amount: 100_000_001 })
        .success,
    ).toBe(false);
  });

  it("requires title, category, amount, date", () => {
    for (const k of ["title", "category", "amount", "date"] as const) {
      const body: Record<string, unknown> = { ...valid };
      delete body[k];
      expect(panelExpenseCreateSchema.safeParse(body).success).toBe(false);
    }
  });

  it("does NOT accept status on create (stripped — always pending)", () => {
    const parsed = panelExpenseCreateSchema.parse({
      ...valid,
      status: "approved",
    });
    expect(parsed).not.toHaveProperty("status");
  });

  it("rejects an over-length currency (>8)", () => {
    expect(
      panelExpenseCreateSchema.safeParse({ ...valid, currency: "TOOLONGCUR" })
        .success,
    ).toBe(false);
  });

  it("update: status enum validated (shape only), empty rejected", () => {
    expect(
      panelExpenseUpdateSchema.safeParse({ status: "approved" }).success,
    ).toBe(true);
    expect(panelExpenseUpdateSchema.safeParse({ status: "paid" }).success).toBe(
      false,
    );
    expect(panelExpenseUpdateSchema.safeParse({}).success).toBe(false);
  });
});

describe("panel application-status schema", () => {
  it("accepts a valid status", () => {
    for (const s of ["new", "reviewing", "accepted", "rejected"]) {
      expect(
        panelApplicationStatusSchema.safeParse({ status: s }).success,
      ).toBe(true);
    }
  });

  it("requires status and rejects an invalid one", () => {
    expect(panelApplicationStatusSchema.safeParse({}).success).toBe(false);
    expect(
      panelApplicationStatusSchema.safeParse({ status: "maybe" }).success,
    ).toBe(false);
  });

  it("ignores other fields (content is read-only)", () => {
    const parsed = panelApplicationStatusSchema.parse({
      status: "accepted",
      email: "hacker@example.com",
      name: "x",
    });
    expect(parsed).toEqual({ status: "accepted" });
  });
});

describe("panel sponsor schemas", () => {
  const valid = {
    name: "ACME",
    logoUrl: "https://cdn.example.com/acme.png",
    tier: "gold",
  };

  it("accepts a valid create and defaults active to true", () => {
    expect(panelSponsorCreateSchema.parse(valid).active).toBe(true);
  });

  it("requires name, logoUrl (http(s)), and tier", () => {
    expect(
      panelSponsorCreateSchema.safeParse({
        logoUrl: valid.logoUrl,
        tier: "gold",
      }).success,
    ).toBe(false);
    expect(
      panelSponsorCreateSchema.safeParse({ name: "A", tier: "gold" }).success,
    ).toBe(false);
    expect(
      panelSponsorCreateSchema.safeParse({ name: "A", logoUrl: valid.logoUrl })
        .success,
    ).toBe(false);
  });

  it("rejects a non-http(s) or malformed logoUrl and a bad tier", () => {
    expect(
      panelSponsorCreateSchema.safeParse({ ...valid, logoUrl: "ftp://x/y" })
        .success,
    ).toBe(false);
    expect(
      panelSponsorCreateSchema.safeParse({ ...valid, logoUrl: "not a url" })
        .success,
    ).toBe(false);
    expect(
      panelSponsorCreateSchema.safeParse({ ...valid, tier: "platinum" })
        .success,
    ).toBe(false);
  });

  it("website must be a valid http(s) URL when present", () => {
    expect(
      panelSponsorCreateSchema.safeParse({
        ...valid,
        website: "https://acme.com",
      }).success,
    ).toBe(true);
    expect(
      panelSponsorCreateSchema.safeParse({
        ...valid,
        website: "javascript:alert(1)",
      }).success,
    ).toBe(false);
  });

  it("update: partial ok, clearable website via null, empty rejected", () => {
    expect(panelSponsorUpdateSchema.safeParse({ active: false }).success).toBe(
      true,
    );
    expect(panelSponsorUpdateSchema.safeParse({ website: null }).success).toBe(
      true,
    );
    expect(panelSponsorUpdateSchema.safeParse({}).success).toBe(false);
  });
});
