import { describe, expect, it } from "vitest";

import {
  applicationSchema,
  contactSchema,
  firstErrorMessage,
} from "@/lib/validation";

const validApplication = {
  name: "Ada Yılmaz",
  email: "ada@example.com",
  subteamPref: "Yazılım",
  message: "Takıma katılmak istiyorum.",
};

const validContact = {
  name: "Ada Yılmaz",
  email: "ada@example.com",
  subject: "Sponsorluk hakkında",
  message: "Merhaba, sizinle görüşmek istiyoruz.",
};

describe("applicationSchema", () => {
  it("accepts a valid application", () => {
    const parsed = applicationSchema.parse(validApplication);
    expect(parsed).toEqual(validApplication);
  });

  it("trims surrounding whitespace", () => {
    const parsed = applicationSchema.parse({
      ...validApplication,
      name: "  Ada  ",
    });
    expect(parsed.name).toBe("Ada");
  });

  it("strips unknown keys (blocks server-assigned field injection)", () => {
    const parsed = applicationSchema.parse({
      ...validApplication,
      status: "accepted",
      id: "hacked",
      createdAt: "2000-01-01",
    });
    expect(parsed).not.toHaveProperty("status");
    expect(parsed).not.toHaveProperty("id");
    expect(parsed).not.toHaveProperty("createdAt");
  });

  it.each(["name", "email", "subteamPref", "message"] as const)(
    "rejects a missing required field: %s",
    (field) => {
      const body: Record<string, unknown> = { ...validApplication };
      delete body[field];
      expect(applicationSchema.safeParse(body).success).toBe(false);
    },
  );

  it.each(["name", "subteamPref", "message"] as const)(
    "rejects a whitespace-only %s (fails min after trim)",
    (field) => {
      const result = applicationSchema.safeParse({
        ...validApplication,
        [field]: "   ",
      });
      expect(result.success).toBe(false);
    },
  );

  it("rejects a malformed email", () => {
    const result = applicationSchema.safeParse({
      ...validApplication,
      email: "not-an-email",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an over-length name (>120)", () => {
    const result = applicationSchema.safeParse({
      ...validApplication,
      name: "a".repeat(121),
    });
    expect(result.success).toBe(false);
  });

  it("rejects an over-length email (>254)", () => {
    const longLocal = "a".repeat(250);
    const result = applicationSchema.safeParse({
      ...validApplication,
      email: `${longLocal}@example.com`,
    });
    expect(result.success).toBe(false);
  });

  it("rejects an over-length message (>5000)", () => {
    const result = applicationSchema.safeParse({
      ...validApplication,
      message: "a".repeat(5001),
    });
    expect(result.success).toBe(false);
  });

  it("accepts boundary lengths (name=120, message=5000)", () => {
    const result = applicationSchema.safeParse({
      ...validApplication,
      name: "a".repeat(120),
      message: "a".repeat(5000),
    });
    expect(result.success).toBe(true);
  });
});

describe("contactSchema", () => {
  it("accepts a valid contact message", () => {
    const parsed = contactSchema.parse(validContact);
    expect(parsed).toEqual(validContact);
  });

  it("accepts an omitted subject (optional)", () => {
    const result = contactSchema.safeParse({
      name: validContact.name,
      email: validContact.email,
      message: validContact.message,
    });
    expect(result.success).toBe(true);
  });

  it("rejects an over-length subject (>200)", () => {
    const result = contactSchema.safeParse({
      ...validContact,
      subject: "a".repeat(201),
    });
    expect(result.success).toBe(false);
  });

  it.each(["name", "email", "message"] as const)(
    "rejects a missing required field: %s",
    (field) => {
      const body: Record<string, unknown> = { ...validContact };
      delete body[field];
      expect(contactSchema.safeParse(body).success).toBe(false);
    },
  );

  it("rejects a malformed email", () => {
    const result = contactSchema.safeParse({
      ...validContact,
      email: "bad@",
    });
    expect(result.success).toBe(false);
  });
});

describe("firstErrorMessage", () => {
  it("returns a human-safe message for a failed parse", () => {
    const result = applicationSchema.safeParse({
      ...validApplication,
      email: "nope",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(firstErrorMessage(result.error)).toBe("Invalid email address.");
    }
  });
});
