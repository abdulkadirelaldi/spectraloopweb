import { describe, expect, it } from "vitest";

import { firstErrorMessage } from "@/lib/validation";
import {
  buildUploadKey,
  maxBytesForContentType,
  sanitizeUploadFileName,
  uploadRequestSchema,
} from "@/lib/validation/upload";

const MB = 1024 * 1024;
const valid = {
  fileName: "rapor.pdf",
  contentType: "application/pdf",
  size: 1000,
};

describe("uploadRequestSchema — valid", () => {
  it("accepts a well-formed request", () => {
    const parsed = uploadRequestSchema.parse(valid);
    expect(parsed).toMatchObject({
      fileName: "rapor.pdf",
      contentType: "application/pdf",
      size: 1000,
    });
  });

  it("trims the fileName", () => {
    expect(
      uploadRequestSchema.parse({ ...valid, fileName: "  a.pdf  " }).fileName,
    ).toBe("a.pdf");
  });
});

describe("uploadRequestSchema — contentType allow-list", () => {
  it("rejects a disallowed content type", () => {
    for (const ct of [
      "text/html",
      "image/svg+xml",
      "application/x-msdownload",
    ]) {
      expect(
        uploadRequestSchema.safeParse({ ...valid, contentType: ct }).success,
      ).toBe(false);
    }
  });
});

describe("uploadRequestSchema — size", () => {
  it("rejects zero, negative, non-integer, and NaN", () => {
    for (const size of [0, -1, 1.5, Number.NaN]) {
      expect(uploadRequestSchema.safeParse({ ...valid, size }).success).toBe(
        false,
      );
    }
  });

  it("rejects over the global 25MB cap", () => {
    expect(
      uploadRequestSchema.safeParse({ ...valid, size: 26 * MB }).success,
    ).toBe(false);
  });

  it("enforces the stricter 10MB per-type image cap", () => {
    expect(
      uploadRequestSchema.safeParse({
        fileName: "a.png",
        contentType: "image/png",
        size: 11 * MB,
      }).success,
    ).toBe(false);
    expect(
      uploadRequestSchema.safeParse({
        fileName: "a.png",
        contentType: "image/png",
        size: 8 * MB,
      }).success,
    ).toBe(true);
  });
});

describe("uploadRequestSchema — fileName safety", () => {
  it.each([
    ["empty / whitespace", "   "],
    ["path traversal ../", "../etc/passwd"],
    ["nested path", "sub/dir/a.pdf"],
    ["windows path", "C:\\Windows\\a.pdf"],
    ["backslash", "a\\b.pdf"],
    ["dot", "."],
    ["dotdot", ".."],
    ["leading dot (hidden)", ".htaccess"],
    ["dangerous ext .exe", "malware.exe"],
    ["dangerous ext .svg", "logo.svg"],
    ["double extension", "invoice.php.pdf"],
    ["null byte", "a\u0000.pdf"],
  ])("rejects %s", (_label, fileName) => {
    expect(uploadRequestSchema.safeParse({ ...valid, fileName }).success).toBe(
      false,
    );
  });

  it("rejects a fileName longer than 255 chars", () => {
    const long = `${"a".repeat(260)}.pdf`;
    expect(
      uploadRequestSchema.safeParse({ ...valid, fileName: long }).success,
    ).toBe(false);
  });

  it("accepts a normal name and gives a human-safe error otherwise", () => {
    expect(
      uploadRequestSchema.safeParse({ ...valid, fileName: "Ek-1_final.pdf" })
        .success,
    ).toBe(true);
    const bad = uploadRequestSchema.safeParse({ ...valid, fileName: "../x" });
    expect(bad.success).toBe(false);
    if (!bad.success)
      expect(typeof firstErrorMessage(bad.error)).toBe("string");
  });
});

describe("maxBytesForContentType", () => {
  it("images get the 10MB cap; everything else the 25MB cap", () => {
    expect(maxBytesForContentType("image/png")).toBe(10 * MB);
    expect(maxBytesForContentType("image/jpeg")).toBe(10 * MB);
    expect(maxBytesForContentType("application/pdf")).toBe(25 * MB);
    expect(maxBytesForContentType("application/zip")).toBe(25 * MB);
  });
});

describe("sanitizeUploadFileName", () => {
  it("strips any directory portion (path-traversal defence)", () => {
    expect(sanitizeUploadFileName("../../etc/passwd")).toBe("passwd");
    expect(sanitizeUploadFileName("a/b/c.pdf")).toBe("c.pdf");
    expect(sanitizeUploadFileName("C:\\Users\\x\\report.pdf")).toBe(
      "report.pdf",
    );
  });

  it("restricts the charset and collapses/strips separators", () => {
    const out = sanitizeUploadFileName("  ..My Résumé (final)!!.pdf ");
    expect(out).toMatch(/^[a-zA-Z0-9._-]+$/);
    expect(out.startsWith(".")).toBe(false);
    expect(out.startsWith("-")).toBe(false);
    expect(out.endsWith(".")).toBe(false);
  });

  it("never returns an empty string", () => {
    expect(sanitizeUploadFileName("///")).toBe("file");
    expect(sanitizeUploadFileName("...")).toBe("file");
    expect(sanitizeUploadFileName("")).toBe("file");
  });

  it("caps length at 100", () => {
    expect(sanitizeUploadFileName("a".repeat(300)).length).toBeLessThanOrEqual(
      100,
    );
  });
});

describe("buildUploadKey", () => {
  const UUID = "11111111-1111-1111-1111-111111111111";

  it("produces documents/<uuid>-<safeName>", () => {
    expect(buildUploadKey("rapor.pdf", UUID)).toBe(
      `documents/${UUID}-rapor.pdf`,
    );
  });

  it("cannot be escaped by a traversal name (stays under documents/)", () => {
    const key = buildUploadKey("../../../etc/passwd", UUID);
    expect(key.startsWith("documents/")).toBe(true);
    expect(key).not.toContain("..");
    expect(key).not.toContain("/etc/");
  });

  it("defaults to a random uuid when none is supplied", () => {
    const a = buildUploadKey("a.pdf");
    const b = buildUploadKey("a.pdf");
    expect(a).not.toBe(b); // uuid differs
    expect(a).toMatch(/^documents\/[0-9a-f-]{36}-a\.pdf$/);
  });
});
