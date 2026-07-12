import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth/index", () => ({ auth: vi.fn() }));
// Keep the REAL r2 constants (so the real uploadRequestSchema + buildUploadKey
// run) but stub the presign so no aws-sdk call / bucket / env is needed.
vi.mock("@/lib/utils/r2", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/utils/r2")>();
  return {
    ...actual,
    createPresignedUpload: vi.fn().mockResolvedValue({
      uploadUrl:
        "https://account.r2.cloudflarestorage.com/bucket/documents/x?sig",
      fileUrl: "https://cdn.example.com/documents/x",
      key: "documents/x",
      expiresIn: 300,
    }),
  };
});

import { auth } from "@/lib/auth/index";
import { createPresignedUpload } from "@/lib/utils/r2";
import { POST as uploadsPOST } from "@/app/api/panel/uploads/route";

import { asAuthMock, asMock, jsonReq, session } from "./_panel";

const authMock = asAuthMock(auth);
const r2 = asMock({ createPresignedUpload });

const validBody = {
  fileName: "rapor.pdf",
  contentType: "application/pdf",
  size: 1000,
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("POST /api/panel/uploads — authorization", () => {
  it("401 when unauthenticated (no presign requested)", async () => {
    authMock.mockResolvedValue(null);
    expect((await uploadsPOST(jsonReq("POST", validBody))).status).toBe(401);
    expect(r2.createPresignedUpload).not.toHaveBeenCalled();
  });

  it("403 for a member", async () => {
    authMock.mockResolvedValue(session("member"));
    expect((await uploadsPOST(jsonReq("POST", validBody))).status).toBe(403);
    expect(r2.createPresignedUpload).not.toHaveBeenCalled();
  });

  it.each(["admin", "lead"] as const)(
    "200 for %s with a valid request",
    async (role) => {
      authMock.mockResolvedValue(session(role, { subteam: "mechanical" }));
      const res = await uploadsPOST(jsonReq("POST", validBody));
      expect(res.status).toBe(200);
      expect(r2.createPresignedUpload).toHaveBeenCalledTimes(1);
    },
  );
});

describe("POST /api/panel/uploads — 3.S1 validation at the endpoint", () => {
  beforeEach(() => authMock.mockResolvedValue(session("admin")));

  it.each([
    ["disallowed contentType", { ...validBody, contentType: "text/html" }],
    ["oversize", { ...validBody, size: 26 * 1024 * 1024 }],
    ["zero size", { ...validBody, size: 0 }],
    [
      "path-traversal fileName",
      { ...validBody, fileName: "../../../etc/passwd" },
    ],
    ["dangerous extension", { ...validBody, fileName: "malware.exe" }],
    ["nested path fileName", { ...validBody, fileName: "a/b/c.pdf" }],
  ])("400 for %s (no presign)", async (_label, body) => {
    const res = await uploadsPOST(jsonReq("POST", body));
    expect(res.status).toBe(400);
    expect(r2.createPresignedUpload).not.toHaveBeenCalled();
  });

  it("passes a safe, uuid-prefixed key to the presigner (never the raw path)", async () => {
    await uploadsPOST(
      jsonReq("POST", { ...validBody, fileName: "Rapor Final.pdf" }),
    );
    const arg = r2.createPresignedUpload.mock.calls[0]?.[0] as { key: string };
    expect(arg.key).toMatch(/^documents\/[0-9a-f-]{36}-/);
    expect(arg.key).not.toContain(" ");
  });
});
