import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db/connect", () => ({
  connectToDatabase: vi.fn().mockResolvedValue({}),
}));
vi.mock("@/lib/auth/index", () => ({ auth: vi.fn() }));
vi.mock("@/models/Inventory", () => ({
  Inventory: {
    find: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    findByIdAndUpdate: vi.fn(),
    findByIdAndDelete: vi.fn(),
  },
}));

import { auth } from "@/lib/auth/index";
import { Inventory } from "@/models/Inventory";
import { POST as invPOST } from "@/app/api/panel/inventory/route";
import {
  DELETE as invDELETE,
  PATCH as invPATCH,
} from "@/app/api/panel/inventory/[id]/route";

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
import { GET as invGET } from "@/app/api/panel/inventory/route";

const authMock = asAuthMock(auth);
const InvMock = asMock(Inventory);

const MECH = "mechanical";
const ELEC = "electronics";

const invDoc = (o = {}) => ({
  _id: IDS.doc,
  name: "Cıvata M6",
  category: "Bağlantı",
  quantity: 100,
  unit: "adet",
  subteam: MECH,
  status: "available",
  createdBy: IDS.other,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  ...o,
});
const create = {
  name: "Cıvata",
  category: "Bağlantı",
  unit: "adet",
  quantity: 10,
};

beforeEach(() => {
  vi.clearAllMocks();
  InvMock.find.mockReturnValue(leanQuery([invDoc()]));
  InvMock.findById.mockReturnValue(leanQuery(invDoc()));
  InvMock.findByIdAndUpdate.mockReturnValue(leanQuery(invDoc()));
  InvMock.findByIdAndDelete.mockResolvedValue(invDoc());
  InvMock.create.mockResolvedValue(invDoc());
});

describe("inventory reads (any authenticated user)", () => {
  it("401 unauth; member may read the list (200)", async () => {
    authMock.mockResolvedValue(null);
    expect((await invGET(getReq())).status).toBe(401);
    authMock.mockResolvedValue(session("member"));
    expect((await invGET(getReq())).status).toBe(200);
  });
});

describe("inventory create (admin/lead; lead subteam IDOR)", () => {
  it("member write → 403", async () => {
    authMock.mockResolvedValue(session("member"));
    const res = await invPOST(jsonReq("POST", { ...create, subteam: MECH }));
    expect(res.status).toBe(403);
    expect(InvMock.create).not.toHaveBeenCalled();
  });

  it("lead creates in own subteam (201, pinned)", async () => {
    authMock.mockResolvedValue(session("lead", { subteam: MECH }));
    const res = await invPOST(jsonReq("POST", create));
    expect(res.status).toBe(201);
    expect(InvMock.create).toHaveBeenCalledWith(
      expect.objectContaining({ subteam: MECH, createdBy: IDS.me }),
    );
  });

  it("lead targeting another subteam → 403 (IDOR)", async () => {
    authMock.mockResolvedValue(session("lead", { subteam: MECH }));
    const res = await invPOST(jsonReq("POST", { ...create, subteam: ELEC }));
    expect(res.status).toBe(403);
    expect(InvMock.create).not.toHaveBeenCalled();
  });

  it("admin creates for any subteam (201)", async () => {
    authMock.mockResolvedValue(session("admin"));
    expect(
      (await invPOST(jsonReq("POST", { ...create, subteam: ELEC }))).status,
    ).toBe(201);
  });
});

describe("inventory update/delete (member 403; lead subteam-scoped)", () => {
  it("member cannot edit or delete (403)", async () => {
    authMock.mockResolvedValue(session("member"));
    expect(
      (await invPATCH(jsonReq("PATCH", { quantity: 5 }), ctx(IDS.doc))).status,
    ).toBe(403);
    expect((await invDELETE(jsonReq("DELETE"), ctx(IDS.doc))).status).toBe(403);
  });

  it("lead may edit own subteam, not another; cannot move subteam", async () => {
    authMock.mockResolvedValue(session("lead", { subteam: MECH }));
    InvMock.findById.mockReturnValue(leanQuery(invDoc({ subteam: MECH })));
    expect(
      (await invPATCH(jsonReq("PATCH", { quantity: 5 }), ctx(IDS.doc))).status,
    ).toBe(200);
    expect(
      (await invPATCH(jsonReq("PATCH", { subteam: ELEC }), ctx(IDS.doc)))
        .status,
    ).toBe(403);

    InvMock.findById.mockReturnValue(leanQuery(invDoc({ subteam: ELEC })));
    expect(
      (await invPATCH(jsonReq("PATCH", { quantity: 5 }), ctx(IDS.doc))).status,
    ).toBe(403);
  });

  it("admin may edit/delete any item (200)", async () => {
    authMock.mockResolvedValue(session("admin"));
    InvMock.findById.mockReturnValue(leanQuery(invDoc({ subteam: ELEC })));
    expect(
      (await invPATCH(jsonReq("PATCH", { status: "in-use" }), ctx(IDS.doc)))
        .status,
    ).toBe(200);
    expect((await invDELETE(jsonReq("DELETE"), ctx(IDS.doc))).status).toBe(200);
  });
});
