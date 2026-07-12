import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db/connect", () => ({
  connectToDatabase: vi.fn().mockResolvedValue({}),
}));
vi.mock("@/lib/auth/index", () => ({ auth: vi.fn() }));
vi.mock("@/models/Expense", () => ({
  Expense: {
    find: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    findByIdAndUpdate: vi.fn(),
    findByIdAndDelete: vi.fn(),
  },
}));

import { auth } from "@/lib/auth/index";
import { Expense } from "@/models/Expense";
import {
  GET as budgetGET,
  POST as budgetPOST,
} from "@/app/api/panel/budget/route";
import {
  DELETE as expDELETE,
  PATCH as expPATCH,
} from "@/app/api/panel/budget/[id]/route";

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
const ExpMock = asMock(Expense);

const MECH = "mechanical";
const ELEC = "electronics";
const ISO = "2026-05-01T00:00:00.000Z";

const expDoc = (o = {}) => ({
  _id: IDS.doc,
  title: "Kablo",
  amount: 250,
  currency: "TRY",
  category: "Elektronik",
  subteam: MECH,
  date: new Date(ISO),
  status: "pending",
  submittedBy: IDS.me,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  ...o,
});
const create = {
  title: "Kablo",
  amount: 250,
  category: "Elektronik",
  date: ISO,
};

beforeEach(() => {
  vi.clearAllMocks();
  ExpMock.find.mockReturnValue(leanQuery([expDoc()]));
  ExpMock.findById.mockReturnValue(leanQuery(expDoc()));
  ExpMock.findByIdAndUpdate.mockReturnValue(leanQuery(expDoc()));
  ExpMock.findByIdAndDelete.mockResolvedValue(expDoc());
  ExpMock.create.mockResolvedValue(expDoc());
});

describe("budget reads (financial — admin/lead only)", () => {
  it("401 unauth; member CANNOT see expenses (403)", async () => {
    authMock.mockResolvedValue(null);
    expect((await budgetGET(getReq())).status).toBe(401);
    authMock.mockResolvedValue(session("member"));
    const res = await budgetGET(getReq());
    expect(res.status).toBe(403);
    expect(ExpMock.find).not.toHaveBeenCalled();
  });

  it.each(["admin", "lead"] as const)("%s may list expenses", async (role) => {
    authMock.mockResolvedValue(session(role, { subteam: MECH }));
    expect((await budgetGET(getReq())).status).toBe(200);
  });
});

describe("expense create (admin/lead; lead subteam IDOR)", () => {
  it("member → 403", async () => {
    authMock.mockResolvedValue(session("member"));
    expect((await budgetPOST(jsonReq("POST", create))).status).toBe(403);
  });

  it("lead own subteam 201; other subteam 403", async () => {
    authMock.mockResolvedValue(session("lead", { subteam: MECH }));
    expect((await budgetPOST(jsonReq("POST", create))).status).toBe(201);
    expect(
      (await budgetPOST(jsonReq("POST", { ...create, subteam: ELEC }))).status,
    ).toBe(403);
  });
});

describe("expense update — approval is admin-only (privilege escalation)", () => {
  it("lead CANNOT change status / approve (403)", async () => {
    authMock.mockResolvedValue(session("lead", { subteam: MECH }));
    ExpMock.findById.mockReturnValue(
      leanQuery(expDoc({ subteam: MECH, status: "pending" })),
    );
    const res = await expPATCH(
      jsonReq("PATCH", { status: "approved" }),
      ctx(IDS.doc),
    );
    expect(res.status).toBe(403);
    expect(ExpMock.findByIdAndUpdate).not.toHaveBeenCalled();
  });

  it("lead may edit a pending own-subteam expense (non-status) → 200", async () => {
    authMock.mockResolvedValue(session("lead", { subteam: MECH }));
    ExpMock.findById.mockReturnValue(
      leanQuery(expDoc({ subteam: MECH, status: "pending" })),
    );
    expect(
      (await expPATCH(jsonReq("PATCH", { amount: 300 }), ctx(IDS.doc))).status,
    ).toBe(200);
  });

  it("lead CANNOT edit an already-approved expense (403)", async () => {
    authMock.mockResolvedValue(session("lead", { subteam: MECH }));
    ExpMock.findById.mockReturnValue(
      leanQuery(expDoc({ subteam: MECH, status: "approved" })),
    );
    expect(
      (await expPATCH(jsonReq("PATCH", { amount: 300 }), ctx(IDS.doc))).status,
    ).toBe(403);
  });

  it("lead CANNOT edit another subteam's expense (403)", async () => {
    authMock.mockResolvedValue(session("lead", { subteam: MECH }));
    ExpMock.findById.mockReturnValue(
      leanQuery(expDoc({ subteam: ELEC, status: "pending" })),
    );
    expect(
      (await expPATCH(jsonReq("PATCH", { amount: 300 }), ctx(IDS.doc))).status,
    ).toBe(403);
  });

  it("admin MAY approve (change status) → 200", async () => {
    authMock.mockResolvedValue(session("admin"));
    ExpMock.findById.mockReturnValue(leanQuery(expDoc({ status: "pending" })));
    expect(
      (await expPATCH(jsonReq("PATCH", { status: "approved" }), ctx(IDS.doc)))
        .status,
    ).toBe(200);
  });
});

describe("expense delete", () => {
  it("member → 403", async () => {
    authMock.mockResolvedValue(session("member"));
    expect((await expDELETE(jsonReq("DELETE"), ctx(IDS.doc))).status).toBe(403);
  });

  it("lead may delete only their OWN pending request (403 otherwise)", async () => {
    authMock.mockResolvedValue(session("lead", { id: IDS.me, subteam: MECH }));
    ExpMock.findById.mockReturnValue(
      leanQuery(
        expDoc({ subteam: MECH, status: "pending", submittedBy: IDS.me }),
      ),
    );
    expect((await expDELETE(jsonReq("DELETE"), ctx(IDS.doc))).status).toBe(200);

    ExpMock.findById.mockReturnValue(
      leanQuery(
        expDoc({ subteam: MECH, status: "pending", submittedBy: IDS.other }),
      ),
    );
    expect((await expDELETE(jsonReq("DELETE"), ctx(IDS.doc))).status).toBe(403);
  });

  it("admin may delete any expense (200)", async () => {
    authMock.mockResolvedValue(session("admin"));
    expect((await expDELETE(jsonReq("DELETE"), ctx(IDS.doc))).status).toBe(200);
  });
});
