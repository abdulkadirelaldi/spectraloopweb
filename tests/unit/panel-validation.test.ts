import { describe, expect, it } from "vitest";

import {
  firstErrorMessage,
  panelAnnouncementCreateSchema,
  panelAnnouncementUpdateSchema,
  panelDocumentCreateSchema,
  panelDocumentUpdateSchema,
  panelEventCreateSchema,
  panelEventUpdateSchema,
  panelMemberCreateSchema,
  panelMemberUpdateSchema,
  panelTaskCreateSchema,
  panelTaskUpdateSchema,
} from "@/lib/validation";

const ISO = "2026-08-01T10:00:00.000Z";

describe("panel announcement schemas", () => {
  it("accepts a valid create and applies defaults", () => {
    const parsed = panelAnnouncementCreateSchema.parse({
      title: "Duyuru",
      body: "İçerik",
    });
    expect(parsed).toMatchObject({ audience: "all", publishedToPublic: false });
  });

  it("requires title and body", () => {
    expect(panelAnnouncementCreateSchema.safeParse({ body: "x" }).success).toBe(
      false,
    );
    expect(
      panelAnnouncementCreateSchema.safeParse({ title: "x" }).success,
    ).toBe(false);
  });

  it("rejects an invalid audience enum", () => {
    expect(
      panelAnnouncementCreateSchema.safeParse({
        title: "t",
        body: "b",
        audience: "everyone",
      }).success,
    ).toBe(false);
  });

  it("rejects over-length title (>200) and body (>10000)", () => {
    expect(
      panelAnnouncementCreateSchema.safeParse({
        title: "a".repeat(201),
        body: "b",
      }).success,
    ).toBe(false);
    expect(
      panelAnnouncementCreateSchema.safeParse({
        title: "t",
        body: "a".repeat(10001),
      }).success,
    ).toBe(false);
  });

  it("update accepts a partial and rejects an empty body", () => {
    expect(
      panelAnnouncementUpdateSchema.safeParse({ publishedToPublic: true })
        .success,
    ).toBe(true);
    const empty = panelAnnouncementUpdateSchema.safeParse({});
    expect(empty.success).toBe(false);
    if (!empty.success) {
      expect(firstErrorMessage(empty.error)).toBe(
        "No updatable fields provided.",
      );
    }
  });
});

describe("panel task schemas", () => {
  it("accepts a minimal create (only title) with status default", () => {
    const parsed = panelTaskCreateSchema.parse({ title: "Görev" });
    expect(parsed.status).toBe("todo");
  });

  it("rejects an invalid status enum and over-long assigneeId (>64)", () => {
    expect(
      panelTaskCreateSchema.safeParse({ title: "t", status: "blocked" })
        .success,
    ).toBe(false);
    expect(
      panelTaskCreateSchema.safeParse({
        title: "t",
        assigneeId: "a".repeat(65),
      }).success,
    ).toBe(false);
  });

  it("parses a valid dueDate to a Date; rejects an invalid one", () => {
    const parsed = panelTaskCreateSchema.parse({ title: "t", dueDate: ISO });
    expect(parsed.dueDate).toBeInstanceOf(Date);
    expect(
      panelTaskCreateSchema.safeParse({ title: "t", dueDate: "nope" }).success,
    ).toBe(false);
  });

  it("create rejects null for an optional field", () => {
    expect(
      panelTaskCreateSchema.safeParse({ title: "t", subteam: null }).success,
    ).toBe(false);
  });

  it("update allows clearing a field with null", () => {
    expect(panelTaskUpdateSchema.safeParse({ subteam: null }).success).toBe(
      true,
    );
    expect(panelTaskUpdateSchema.safeParse({ assigneeId: null }).success).toBe(
      true,
    );
  });

  it("update rejects an empty body", () => {
    expect(panelTaskUpdateSchema.safeParse({}).success).toBe(false);
  });
});

describe("panel member schemas", () => {
  it("accepts a valid create, lowercases email, applies role/active defaults", () => {
    const parsed = panelMemberCreateSchema.parse({
      name: "Ada",
      email: "Ada@Example.COM",
    });
    expect(parsed).toMatchObject({
      email: "ada@example.com",
      role: "member",
      active: true,
    });
  });

  it("requires name and a valid email", () => {
    expect(
      panelMemberCreateSchema.safeParse({ email: "a@b.com" }).success,
    ).toBe(false);
    expect(
      panelMemberCreateSchema.safeParse({ name: "N", email: "bad" }).success,
    ).toBe(false);
  });

  it("rejects an invalid role and a too-short password (<8)", () => {
    expect(
      panelMemberCreateSchema.safeParse({
        name: "N",
        email: "a@b.com",
        role: "boss",
      }).success,
    ).toBe(false);
    expect(
      panelMemberCreateSchema.safeParse({
        name: "N",
        email: "a@b.com",
        password: "short",
      }).success,
    ).toBe(false);
  });

  it("accepts an 8-char password", () => {
    expect(
      panelMemberCreateSchema.safeParse({
        name: "N",
        email: "a@b.com",
        password: "12345678",
      }).success,
    ).toBe(true);
  });

  it("update rejects an empty body but allows clearing subteam", () => {
    expect(panelMemberUpdateSchema.safeParse({}).success).toBe(false);
    expect(panelMemberUpdateSchema.safeParse({ subteam: null }).success).toBe(
      true,
    );
  });
});

describe("panel document schemas", () => {
  it("accepts a valid http(s) fileUrl and defaults category to other", () => {
    const parsed = panelDocumentCreateSchema.parse({
      title: "Rapor",
      fileUrl: "https://cdn.example.com/a.pdf",
    });
    expect(parsed.category).toBe("other");
  });

  it("rejects a non-http(s) or malformed fileUrl", () => {
    expect(
      panelDocumentCreateSchema.safeParse({
        title: "t",
        fileUrl: "ftp://x/y",
      }).success,
    ).toBe(false);
    expect(
      panelDocumentCreateSchema.safeParse({ title: "t", fileUrl: "not a url" })
        .success,
    ).toBe(false);
  });

  it("requires title and fileUrl; rejects invalid category", () => {
    expect(panelDocumentCreateSchema.safeParse({ title: "t" }).success).toBe(
      false,
    );
    expect(
      panelDocumentCreateSchema.safeParse({
        title: "t",
        fileUrl: "https://x/y",
        category: "spreadsheet",
      }).success,
    ).toBe(false);
  });

  it("update requires at least one field", () => {
    expect(panelDocumentUpdateSchema.safeParse({}).success).toBe(false);
    expect(panelDocumentUpdateSchema.safeParse({ title: "Yeni" }).success).toBe(
      true,
    );
  });
});

describe("panel event schemas", () => {
  it("accepts a valid create with default type and Date coercion", () => {
    const parsed = panelEventCreateSchema.parse({
      title: "Toplantı",
      date: ISO,
    });
    expect(parsed.type).toBe("other");
    expect(parsed.date).toBeInstanceOf(Date);
  });

  it("requires a valid date and rejects an invalid type", () => {
    expect(panelEventCreateSchema.safeParse({ title: "t" }).success).toBe(
      false,
    );
    expect(
      panelEventCreateSchema.safeParse({ title: "t", date: "nope" }).success,
    ).toBe(false);
    expect(
      panelEventCreateSchema.safeParse({ title: "t", date: ISO, type: "party" })
        .success,
    ).toBe(false);
  });

  it("update allows clearing description with null, rejects empty body", () => {
    expect(
      panelEventUpdateSchema.safeParse({ description: null }).success,
    ).toBe(true);
    expect(panelEventUpdateSchema.safeParse({}).success).toBe(false);
    // date is not clearable (mirrors the Backend's !== undefined gate).
    expect(panelEventUpdateSchema.safeParse({ date: null }).success).toBe(
      false,
    );
  });
});
