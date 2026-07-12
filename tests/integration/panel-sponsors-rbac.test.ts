import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db/connect", () => ({
  connectToDatabase: vi.fn().mockResolvedValue({}),
}));
vi.mock("@/lib/auth/index", () => ({ auth: vi.fn() }));
// The panel sponsors route revalidates public paths on write; stub the Next cache API.
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));
vi.mock("@/models/Sponsor", () => ({
  Sponsor: {
    find: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    findByIdAndUpdate: vi.fn(),
    findByIdAndDelete: vi.fn(),
  },
}));

import { auth } from "@/lib/auth/index";
import { Sponsor } from "@/models/Sponsor";
import {
  GET as sponsorsGET,
  POST as sponsorsPOST,
} from "@/app/api/panel/sponsors/route";
import {
  DELETE as sponsorDELETE,
  PATCH as sponsorPATCH,
} from "@/app/api/panel/sponsors/[id]/route";

import {
  IDS,
  asAuthMock,
  asMock,
  ctx,
  getReq,
  jsonReq,
  leanQuery,
  session,
} from "./_panel";

const authMock = asAuthMock(auth);
const SponsorMock = asMock(Sponsor);

const spDoc = (o = {}) => ({
  _id: IDS.doc,
  name: "ACME",
  logoUrl: "https://cdn.example.com/acme.png",
  tier: "gold",
  active: true,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  ...o,
});
const create = {
  name: "ACME",
  logoUrl: "https://cdn.example.com/acme.png",
  tier: "gold",
};

beforeEach(() => {
  vi.clearAllMocks();
  SponsorMock.find.mockReturnValue(leanQuery([spDoc()]));
  SponsorMock.findById.mockReturnValue(leanQuery(spDoc()));
  SponsorMock.findByIdAndUpdate.mockReturnValue(leanQuery(spDoc()));
  SponsorMock.findByIdAndDelete.mockReturnValue(leanQuery(spDoc()));
  SponsorMock.create.mockResolvedValue(spDoc());
});

describe("sponsors reads (any authenticated user)", () => {
  it("401 unauth; member may read the panel list (200)", async () => {
    authMock.mockResolvedValue(null);
    expect((await sponsorsGET(getReq())).status).toBe(401);
    authMock.mockResolvedValue(session("member"));
    expect((await sponsorsGET(getReq())).status).toBe(200);
  });
});

describe("sponsors writes (CMS — admin only)", () => {
  it.each(["member", "lead"] as const)(
    "%s cannot create/update/delete (403)",
    async (role) => {
      authMock.mockResolvedValue(session(role, { subteam: "mechanical" }));
      expect((await sponsorsPOST(jsonReq("POST", create))).status).toBe(403);
      // The `active` publish toggle is admin-only too.
      expect(
        (await sponsorPATCH(jsonReq("PATCH", { active: false }), ctx(IDS.doc)))
          .status,
      ).toBe(403);
      expect(
        (await sponsorDELETE(jsonReq("DELETE"), ctx(IDS.doc))).status,
      ).toBe(403);
      expect(SponsorMock.create).not.toHaveBeenCalled();
    },
  );

  it("admin may create, toggle active (publish), and delete", async () => {
    authMock.mockResolvedValue(session("admin"));
    expect((await sponsorsPOST(jsonReq("POST", create))).status).toBe(201);
    expect(
      (await sponsorPATCH(jsonReq("PATCH", { active: false }), ctx(IDS.doc)))
        .status,
    ).toBe(200);
    expect((await sponsorDELETE(jsonReq("DELETE"), ctx(IDS.doc))).status).toBe(
      200,
    );
  });

  it("401 when unauthenticated on write", async () => {
    authMock.mockResolvedValue(null);
    expect((await sponsorsPOST(jsonReq("POST", create))).status).toBe(401);
  });
});
