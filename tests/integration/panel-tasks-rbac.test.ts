import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db/connect", () => ({
  connectToDatabase: vi.fn().mockResolvedValue({}),
}));
vi.mock("@/lib/auth/index", () => ({ auth: vi.fn() }));
vi.mock("@/models/Task", () => ({
  Task: {
    find: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    findByIdAndUpdate: vi.fn(),
    findByIdAndDelete: vi.fn(),
  },
}));

import { auth } from "@/lib/auth/index";
import { Task } from "@/models/Task";
import { POST as tasksPOST } from "@/app/api/panel/tasks/route";
import {
  DELETE as taskDELETE,
  PATCH as taskPATCH,
} from "@/app/api/panel/tasks/[id]/route";

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
const TaskMock = asMock(Task);

const MECH = "mechanical";
const ELEC = "electronics";

function taskDoc(over: Record<string, unknown> = {}) {
  return {
    _id: IDS.doc,
    title: "Bir görev",
    subteam: MECH,
    assigneeId: IDS.me,
    status: "todo",
    createdBy: IDS.other,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    ...over,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  // Sensible defaults; individual tests override findById / results.
  TaskMock.findById.mockReturnValue(leanQuery(taskDoc()));
  TaskMock.findByIdAndUpdate.mockReturnValue(leanQuery(taskDoc()));
  TaskMock.findByIdAndDelete.mockResolvedValue(taskDoc());
  TaskMock.create.mockResolvedValue(taskDoc());
});

describe("POST /api/panel/tasks (create)", () => {
  it("401 when unauthenticated", async () => {
    authMock.mockResolvedValue(null);
    const res = await tasksPOST(jsonReq("POST", { title: "T", subteam: MECH }));
    expect(res.status).toBe(401);
  });

  it("403 for a member (write forbidden)", async () => {
    authMock.mockResolvedValue(session("member"));
    const res = await tasksPOST(jsonReq("POST", { title: "T", subteam: MECH }));
    expect(res.status).toBe(403);
    expect(TaskMock.create).not.toHaveBeenCalled();
  });

  it("201 for a lead creating in their own subteam", async () => {
    authMock.mockResolvedValue(session("lead", { subteam: MECH }));
    const res = await tasksPOST(jsonReq("POST", { title: "T" }));
    expect(res.status).toBe(201);
    // Server pins the task to the lead's own subteam.
    expect(TaskMock.create).toHaveBeenCalledWith(
      expect.objectContaining({ subteam: MECH, createdBy: IDS.me }),
    );
  });

  it("403 for a lead targeting another subteam (IDOR)", async () => {
    authMock.mockResolvedValue(session("lead", { subteam: MECH }));
    const res = await tasksPOST(jsonReq("POST", { title: "T", subteam: ELEC }));
    expect(res.status).toBe(403);
    expect(TaskMock.create).not.toHaveBeenCalled();
  });

  it("400 for an admin omitting subteam; 201 with subteam", async () => {
    authMock.mockResolvedValue(session("admin"));
    expect((await tasksPOST(jsonReq("POST", { title: "T" }))).status).toBe(400);
    expect(
      (await tasksPOST(jsonReq("POST", { title: "T", subteam: ELEC }))).status,
    ).toBe(201);
  });
});

describe("PATCH /api/panel/tasks/[id] (member IDOR)", () => {
  it("member may change status of their OWN task", async () => {
    authMock.mockResolvedValue(session("member", { id: IDS.me }));
    TaskMock.findById.mockReturnValue(
      leanQuery(taskDoc({ assigneeId: IDS.me })),
    );
    const res = await taskPATCH(
      jsonReq("PATCH", { status: "done" }),
      ctx(IDS.doc),
    );
    expect(res.status).toBe(200);
  });

  it("member CANNOT change status of someone else's task (403)", async () => {
    authMock.mockResolvedValue(session("member", { id: IDS.me }));
    TaskMock.findById.mockReturnValue(
      leanQuery(taskDoc({ assigneeId: IDS.other })),
    );
    const res = await taskPATCH(
      jsonReq("PATCH", { status: "done" }),
      ctx(IDS.doc),
    );
    expect(res.status).toBe(403);
    expect(TaskMock.findByIdAndUpdate).not.toHaveBeenCalled();
  });

  it("member CANNOT change a non-status field, even on their own task (403)", async () => {
    authMock.mockResolvedValue(session("member", { id: IDS.me }));
    TaskMock.findById.mockReturnValue(
      leanQuery(taskDoc({ assigneeId: IDS.me })),
    );
    const res = await taskPATCH(
      jsonReq("PATCH", { title: "Yeni başlık" }),
      ctx(IDS.doc),
    );
    expect(res.status).toBe(403);
  });
});

describe("PATCH /api/panel/tasks/[id] (lead subteam scope)", () => {
  it("lead may update a task in their own subteam", async () => {
    authMock.mockResolvedValue(session("lead", { subteam: MECH }));
    TaskMock.findById.mockReturnValue(leanQuery(taskDoc({ subteam: MECH })));
    const res = await taskPATCH(
      jsonReq("PATCH", { status: "review" }),
      ctx(IDS.doc),
    );
    expect(res.status).toBe(200);
  });

  it("lead CANNOT update a task in another subteam (403)", async () => {
    authMock.mockResolvedValue(session("lead", { subteam: MECH }));
    TaskMock.findById.mockReturnValue(leanQuery(taskDoc({ subteam: ELEC })));
    const res = await taskPATCH(
      jsonReq("PATCH", { status: "review" }),
      ctx(IDS.doc),
    );
    expect(res.status).toBe(403);
  });

  it("lead CANNOT move a task to another subteam (403)", async () => {
    authMock.mockResolvedValue(session("lead", { subteam: MECH }));
    TaskMock.findById.mockReturnValue(leanQuery(taskDoc({ subteam: MECH })));
    const res = await taskPATCH(
      jsonReq("PATCH", { subteam: ELEC }),
      ctx(IDS.doc),
    );
    expect(res.status).toBe(403);
  });

  it("admin may update any field on any task", async () => {
    authMock.mockResolvedValue(session("admin"));
    TaskMock.findById.mockReturnValue(leanQuery(taskDoc({ subteam: ELEC })));
    const res = await taskPATCH(
      jsonReq("PATCH", { title: "Admin edit", subteam: MECH }),
      ctx(IDS.doc),
    );
    expect(res.status).toBe(200);
  });

  it("401 when unauthenticated", async () => {
    authMock.mockResolvedValue(null);
    const res = await taskPATCH(
      jsonReq("PATCH", { status: "done" }),
      ctx(IDS.doc),
    );
    expect(res.status).toBe(401);
  });
});

describe("DELETE /api/panel/tasks/[id]", () => {
  it("403 for a member", async () => {
    authMock.mockResolvedValue(session("member"));
    const res = await taskDELETE(jsonReq("DELETE"), ctx(IDS.doc));
    expect(res.status).toBe(403);
    expect(TaskMock.findByIdAndDelete).not.toHaveBeenCalled();
  });

  it("lead may delete in own subteam, not another (403)", async () => {
    authMock.mockResolvedValue(session("lead", { subteam: MECH }));
    TaskMock.findById.mockReturnValue(leanQuery(taskDoc({ subteam: MECH })));
    expect((await taskDELETE(jsonReq("DELETE"), ctx(IDS.doc))).status).toBe(
      200,
    );

    TaskMock.findById.mockReturnValue(leanQuery(taskDoc({ subteam: ELEC })));
    expect((await taskDELETE(jsonReq("DELETE"), ctx(IDS.doc))).status).toBe(
      403,
    );
  });

  it("admin may delete any task", async () => {
    authMock.mockResolvedValue(session("admin"));
    const res = await taskDELETE(jsonReq("DELETE"), ctx(IDS.doc));
    expect(res.status).toBe(200);
  });
});
