import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db/connect", () => ({
  connectToDatabase: vi.fn().mockResolvedValue({}),
}));
vi.mock("@/lib/auth/index", () => ({ auth: vi.fn() }));
vi.mock("@/models/Application", () => ({
  Application: {
    find: vi.fn(),
    findById: vi.fn(),
    findByIdAndUpdate: vi.fn(),
    findByIdAndDelete: vi.fn(),
  },
}));

import { auth } from "@/lib/auth/index";
import { Application } from "@/models/Application";
import { GET as appsGET } from "@/app/api/panel/applications/route";
import {
  DELETE as appDELETE,
  PATCH as appPATCH,
} from "@/app/api/panel/applications/[id]/route";

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
const AppMock = asMock(Application);

const appDoc = (o = {}) => ({
  _id: IDS.doc,
  name: "Ada Yılmaz",
  email: "ada@example.com",
  subteamPref: "Yazılım",
  message: "Katılmak istiyorum.",
  status: "new",
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  ...o,
});

beforeEach(() => {
  vi.clearAllMocks();
  AppMock.find.mockReturnValue(leanQuery([appDoc()]));
  AppMock.findByIdAndUpdate.mockReturnValue(leanQuery(appDoc()));
  AppMock.findByIdAndDelete.mockReturnValue(leanQuery(appDoc()));
});

describe("applications directory (PII — admin/lead only)", () => {
  it("401 when unauthenticated", async () => {
    authMock.mockResolvedValue(null);
    expect((await appsGET(getReq())).status).toBe(401);
  });

  it("member CANNOT list applications (PII → 403)", async () => {
    authMock.mockResolvedValue(session("member"));
    const res = await appsGET(getReq());
    expect(res.status).toBe(403);
    expect(AppMock.find).not.toHaveBeenCalled();
  });

  it.each(["admin", "lead"] as const)(
    "%s may list applications",
    async (role) => {
      authMock.mockResolvedValue(session(role, { subteam: "software" }));
      expect((await appsGET(getReq())).status).toBe(200);
    },
  );
});

describe("application status update (content read-only)", () => {
  it("member → 403", async () => {
    authMock.mockResolvedValue(session("member"));
    const res = await appPATCH(
      jsonReq("PATCH", { status: "accepted" }),
      ctx(IDS.doc),
    );
    expect(res.status).toBe(403);
  });

  it("admin may change ONLY the status; content fields are ignored", async () => {
    authMock.mockResolvedValue(session("admin"));
    const res = await appPATCH(
      jsonReq("PATCH", {
        status: "accepted",
        // Attempt to tamper with immutable, public-submitted content:
        name: "Hacker",
        email: "attacker@evil.com",
        message: "overwritten",
      }),
      ctx(IDS.doc),
    );
    expect(res.status).toBe(200);
    // Only `status` reaches the DB write — never name/email/message.
    expect(AppMock.findByIdAndUpdate).toHaveBeenCalledWith(
      IDS.doc,
      { status: "accepted" },
      expect.anything(),
    );
  });

  it("rejects an invalid status (400)", async () => {
    authMock.mockResolvedValue(session("admin"));
    const res = await appPATCH(
      jsonReq("PATCH", { status: "hired" }),
      ctx(IDS.doc),
    );
    expect(res.status).toBe(400);
    expect(AppMock.findByIdAndUpdate).not.toHaveBeenCalled();
  });
});

describe("application delete (admin only)", () => {
  it("lead → 403; admin → 200", async () => {
    authMock.mockResolvedValue(session("lead", { subteam: "software" }));
    expect((await appDELETE(jsonReq("DELETE"), ctx(IDS.doc))).status).toBe(403);
    authMock.mockResolvedValue(session("admin"));
    expect((await appDELETE(jsonReq("DELETE"), ctx(IDS.doc))).status).toBe(200);
  });
});
