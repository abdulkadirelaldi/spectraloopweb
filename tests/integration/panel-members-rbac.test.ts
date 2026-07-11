import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db/connect", () => ({
  connectToDatabase: vi.fn().mockResolvedValue({}),
}));
vi.mock("@/lib/auth/index", () => ({ auth: vi.fn() }));
vi.mock("@/lib/utils/password", () => ({
  hashPassword: vi.fn().mockResolvedValue("hashed-password"),
}));
vi.mock("@/models/User", () => ({
  User: {
    find: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    findByIdAndUpdate: vi.fn(),
    countDocuments: vi.fn(),
  },
}));

import { auth } from "@/lib/auth/index";
import { User } from "@/models/User";
import { POST as membersPOST } from "@/app/api/panel/members/route";
import {
  DELETE as memberDELETE,
  PATCH as memberPATCH,
} from "@/app/api/panel/members/[id]/route";

import {
  IDS,
  asAuthMock,
  asMock,
  ctx,
  jsonReq,
  leanQuery,
  session,
} from "./_panel";

const authMock = asAuthMock(auth);
const UserMock = asMock(User);

const MECH = "mechanical";
const ELEC = "electronics";

function memberDoc(over: Record<string, unknown> = {}) {
  return {
    _id: IDS.doc,
    name: "Üye",
    email: "member@example.com",
    role: "member",
    subteam: MECH,
    active: true,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    ...over,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  UserMock.findById.mockReturnValue(leanQuery(memberDoc()));
  UserMock.findByIdAndUpdate.mockReturnValue(leanQuery(memberDoc()));
  UserMock.create.mockResolvedValue(memberDoc());
  UserMock.countDocuments.mockResolvedValue(1); // by default other admins exist
});

describe("POST /api/panel/members (create — admin only)", () => {
  it.each(["member", "lead"] as const)("403 for %s", async (role) => {
    authMock.mockResolvedValue(session(role, { subteam: MECH }));
    const res = await membersPOST(
      jsonReq("POST", { name: "Yeni", email: "new@example.com" }),
    );
    expect(res.status).toBe(403);
    expect(UserMock.create).not.toHaveBeenCalled();
  });

  it("201 for an admin", async () => {
    authMock.mockResolvedValue(session("admin"));
    const res = await membersPOST(
      jsonReq("POST", { name: "Yeni", email: "new@example.com", role: "lead" }),
    );
    expect(res.status).toBe(201);
    expect(UserMock.create).toHaveBeenCalled();
  });

  it("401 when unauthenticated", async () => {
    authMock.mockResolvedValue(null);
    const res = await membersPOST(
      jsonReq("POST", { name: "Yeni", email: "new@example.com" }),
    );
    expect(res.status).toBe(401);
  });
});

describe("PATCH /api/panel/members/[id] (privilege escalation guards)", () => {
  it("403 for a member", async () => {
    authMock.mockResolvedValue(session("member"));
    const res = await memberPATCH(
      jsonReq("PATCH", { name: "X" }),
      ctx(IDS.doc),
    );
    expect(res.status).toBe(403);
  });

  it("lead may edit name/photoUrl of an own-subteam member", async () => {
    authMock.mockResolvedValue(session("lead", { subteam: MECH }));
    UserMock.findById.mockReturnValue(leanQuery(memberDoc({ subteam: MECH })));
    const res = await memberPATCH(
      jsonReq("PATCH", { name: "Güncel" }),
      ctx(IDS.doc),
    );
    expect(res.status).toBe(200);
  });

  it("lead CANNOT change role (privilege escalation → 403)", async () => {
    authMock.mockResolvedValue(session("lead", { subteam: MECH }));
    UserMock.findById.mockReturnValue(leanQuery(memberDoc({ subteam: MECH })));
    const res = await memberPATCH(
      jsonReq("PATCH", { role: "admin" }),
      ctx(IDS.doc),
    );
    expect(res.status).toBe(403);
    expect(UserMock.findByIdAndUpdate).not.toHaveBeenCalled();
  });

  it("lead CANNOT (de)activate a member (403)", async () => {
    authMock.mockResolvedValue(session("lead", { subteam: MECH }));
    UserMock.findById.mockReturnValue(leanQuery(memberDoc({ subteam: MECH })));
    const res = await memberPATCH(
      jsonReq("PATCH", { active: false }),
      ctx(IDS.doc),
    );
    expect(res.status).toBe(403);
  });

  it("lead CANNOT edit a member of another subteam (403)", async () => {
    authMock.mockResolvedValue(session("lead", { subteam: MECH }));
    UserMock.findById.mockReturnValue(leanQuery(memberDoc({ subteam: ELEC })));
    const res = await memberPATCH(
      jsonReq("PATCH", { name: "X" }),
      ctx(IDS.doc),
    );
    expect(res.status).toBe(403);
  });

  it("admin may change a member's role", async () => {
    authMock.mockResolvedValue(session("admin"));
    UserMock.findById.mockReturnValue(leanQuery(memberDoc({ role: "member" })));
    const res = await memberPATCH(
      jsonReq("PATCH", { role: "lead" }),
      ctx(IDS.doc),
    );
    expect(res.status).toBe(200);
  });

  it("admin CANNOT demote the LAST active admin (self-lockout guard → 403)", async () => {
    authMock.mockResolvedValue(session("admin"));
    UserMock.findById.mockReturnValue(
      leanQuery(memberDoc({ role: "admin", active: true })),
    );
    UserMock.countDocuments.mockResolvedValue(0); // no other active admins
    const res = await memberPATCH(
      jsonReq("PATCH", { role: "member" }),
      ctx(IDS.doc),
    );
    expect(res.status).toBe(403);
  });

  it("admin may demote an admin when another admin exists", async () => {
    authMock.mockResolvedValue(session("admin"));
    UserMock.findById.mockReturnValue(
      leanQuery(memberDoc({ role: "admin", active: true })),
    );
    UserMock.countDocuments.mockResolvedValue(1);
    const res = await memberPATCH(
      jsonReq("PATCH", { role: "member" }),
      ctx(IDS.doc),
    );
    expect(res.status).toBe(200);
  });
});

describe("DELETE /api/panel/members/[id] (soft delete — admin only)", () => {
  it.each(["member", "lead"] as const)("403 for %s", async (role) => {
    authMock.mockResolvedValue(session(role, { subteam: MECH }));
    const res = await memberDELETE(jsonReq("DELETE"), ctx(IDS.doc));
    expect(res.status).toBe(403);
  });

  it("admin soft-deletes a normal member (200)", async () => {
    authMock.mockResolvedValue(session("admin"));
    UserMock.findById.mockReturnValue(leanQuery(memberDoc({ role: "member" })));
    const res = await memberDELETE(jsonReq("DELETE"), ctx(IDS.doc));
    expect(res.status).toBe(200);
    expect(UserMock.findByIdAndUpdate).toHaveBeenCalledWith(
      IDS.doc,
      { active: false },
      expect.anything(),
    );
  });

  it("admin CANNOT deactivate the last active admin (403)", async () => {
    authMock.mockResolvedValue(session("admin"));
    UserMock.findById.mockReturnValue(
      leanQuery(memberDoc({ role: "admin", active: true })),
    );
    UserMock.countDocuments.mockResolvedValue(0);
    const res = await memberDELETE(jsonReq("DELETE"), ctx(IDS.doc));
    expect(res.status).toBe(403);
  });
});
