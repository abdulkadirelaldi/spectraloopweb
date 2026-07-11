import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth/index", () => ({ auth: vi.fn() }));
// Mock the R2 helper so no aws-sdk / real bucket / env is needed.
vi.mock("@/lib/utils/r2", () => ({
  UPLOAD_ALLOWED_CONTENT_TYPES: ["application/pdf", "image/png"],
  UPLOAD_MAX_BYTES: 25 * 1024 * 1024,
  isAllowedContentType: (ct: string) =>
    ["application/pdf", "image/png"].includes(ct),
  createPresignedUpload: vi.fn().mockResolvedValue({
    uploadUrl:
      "https://account.r2.cloudflarestorage.com/bucket/documents/x?sig",
    fileUrl: "https://cdn.example.com/documents/x",
    key: "documents/x",
    expiresIn: 300,
  }),
}));

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

describe("POST /api/panel/uploads (RBAC)", () => {
  it("401 when unauthenticated (no presign requested)", async () => {
    authMock.mockResolvedValue(null);
    const res = await uploadsPOST(jsonReq("POST", validBody));
    expect(res.status).toBe(401);
    expect(r2.createPresignedUpload).not.toHaveBeenCalled();
  });

  it("403 for a member (not admin/lead)", async () => {
    authMock.mockResolvedValue(session("member"));
    const res = await uploadsPOST(jsonReq("POST", validBody));
    expect(res.status).toBe(403);
    expect(r2.createPresignedUpload).not.toHaveBeenCalled();
  });

  it.each(["admin", "lead"] as const)(
    "200 for %s with a valid request",
    async (role) => {
      authMock.mockResolvedValue(session(role, { subteam: "mechanical" }));
      const res = await uploadsPOST(jsonReq("POST", validBody));
      expect(res.status).toBe(200);
      expect(r2.createPresignedUpload).toHaveBeenCalledTimes(1);
      const body = await res.json();
      expect(body).toMatchObject({ ok: true, key: "documents/x" });
    },
  );

  it("400 for an admin with a disallowed contentType (no presign)", async () => {
    authMock.mockResolvedValue(session("admin"));
    const res = await uploadsPOST(
      jsonReq("POST", { ...validBody, contentType: "text/html" }),
    );
    expect(res.status).toBe(400);
    expect(r2.createPresignedUpload).not.toHaveBeenCalled();
  });

  it("400 for an admin exceeding the size cap (no presign)", async () => {
    authMock.mockResolvedValue(session("admin"));
    const res = await uploadsPOST(
      jsonReq("POST", { ...validBody, size: 26 * 1024 * 1024 }),
    );
    expect(res.status).toBe(400);
    expect(r2.createPresignedUpload).not.toHaveBeenCalled();
  });
});
