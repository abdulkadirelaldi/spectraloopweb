import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db/connect", () => ({
  connectToDatabase: vi.fn().mockResolvedValue({}),
}));
vi.mock("@/lib/auth/index", () => ({ auth: vi.fn() }));
vi.mock("@/models/Announcement", () => ({
  Announcement: {
    findById: vi.fn(),
    create: vi.fn(),
    findByIdAndUpdate: vi.fn(),
    findByIdAndDelete: vi.fn(),
  },
}));
vi.mock("@/models/Document", () => ({
  DocumentModel: {
    findById: vi.fn(),
    create: vi.fn(),
    findByIdAndUpdate: vi.fn(),
    findByIdAndDelete: vi.fn(),
  },
}));
vi.mock("@/models/Event", () => ({
  EventModel: {
    findById: vi.fn(),
    create: vi.fn(),
    findByIdAndUpdate: vi.fn(),
    findByIdAndDelete: vi.fn(),
  },
}));

import { auth } from "@/lib/auth/index";
import { Announcement } from "@/models/Announcement";
import { DocumentModel } from "@/models/Document";
import { EventModel } from "@/models/Event";
import { POST as annPOST } from "@/app/api/panel/announcements/route";
import {
  DELETE as annDELETE,
  PATCH as annPATCH,
} from "@/app/api/panel/announcements/[id]/route";
import { POST as docPOST } from "@/app/api/panel/documents/route";
import { PATCH as docPATCH } from "@/app/api/panel/documents/[id]/route";
import { POST as evtPOST } from "@/app/api/panel/events/route";
import { PATCH as evtPATCH } from "@/app/api/panel/events/[id]/route";

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
const AnnMock = asMock(Announcement);
const DocMock = asMock(DocumentModel);
const EvtMock = asMock(EventModel);

const MECH = "mechanical";
const ELEC = "electronics";
const CREATED_AT = new Date("2026-01-01T00:00:00.000Z");

const annDoc = (o = {}) => ({
  _id: IDS.doc,
  title: "Duyuru",
  body: "İçerik",
  audience: "all",
  authorId: IDS.other,
  publishedToPublic: false,
  createdAt: CREATED_AT,
  ...o,
});
const docDoc = (o = {}) => ({
  _id: IDS.doc,
  title: "Doküman",
  fileUrl: "https://cdn.example.com/a.pdf",
  category: "other",
  subteam: MECH,
  uploadedBy: IDS.other,
  createdAt: CREATED_AT,
  ...o,
});
const evtDoc = (o = {}) => ({
  _id: IDS.doc,
  title: "Etkinlik",
  date: CREATED_AT,
  type: "meeting",
  createdAt: CREATED_AT,
  ...o,
});

beforeEach(() => {
  vi.clearAllMocks();
  AnnMock.findById.mockReturnValue(leanQuery(annDoc()));
  AnnMock.findByIdAndUpdate.mockReturnValue(leanQuery(annDoc()));
  AnnMock.findByIdAndDelete.mockReturnValue(leanQuery(annDoc()));
  AnnMock.create.mockResolvedValue(annDoc());
  DocMock.findById.mockReturnValue(leanQuery(docDoc()));
  DocMock.findByIdAndUpdate.mockReturnValue(leanQuery(docDoc()));
  DocMock.create.mockResolvedValue(docDoc());
  EvtMock.findById.mockReturnValue(leanQuery(evtDoc()));
  EvtMock.findByIdAndUpdate.mockReturnValue(leanQuery(evtDoc()));
  EvtMock.create.mockResolvedValue(evtDoc());
});

describe("announcements (admin+lead write; no subteam scope)", () => {
  it("POST: member 403, unauth 401, admin 201, lead 201", async () => {
    authMock.mockResolvedValue(null);
    expect(
      (await annPOST(jsonReq("POST", { title: "T", body: "B" }))).status,
    ).toBe(401);
    authMock.mockResolvedValue(session("member"));
    expect(
      (await annPOST(jsonReq("POST", { title: "T", body: "B" }))).status,
    ).toBe(403);
    authMock.mockResolvedValue(session("admin"));
    expect(
      (await annPOST(jsonReq("POST", { title: "T", body: "B" }))).status,
    ).toBe(201);
    authMock.mockResolvedValue(session("lead", { subteam: MECH }));
    expect(
      (await annPOST(jsonReq("POST", { title: "T", body: "B" }))).status,
    ).toBe(201);
  });

  it("PATCH/DELETE: member 403, admin 200", async () => {
    authMock.mockResolvedValue(session("member"));
    expect(
      (await annPATCH(jsonReq("PATCH", { title: "X" }), ctx(IDS.doc))).status,
    ).toBe(403);
    expect((await annDELETE(jsonReq("DELETE"), ctx(IDS.doc))).status).toBe(403);
    authMock.mockResolvedValue(session("admin"));
    expect(
      (await annPATCH(jsonReq("PATCH", { title: "X" }), ctx(IDS.doc))).status,
    ).toBe(200);
    expect((await annDELETE(jsonReq("DELETE"), ctx(IDS.doc))).status).toBe(200);
  });
});

describe("documents (admin+lead write; lead subteam IDOR)", () => {
  it("POST: member 403; lead own-subteam 201; lead other-subteam 403; admin 201", async () => {
    authMock.mockResolvedValue(session("member"));
    expect(
      (await docPOST(jsonReq("POST", { title: "T", fileUrl: "https://x/y" })))
        .status,
    ).toBe(403);

    authMock.mockResolvedValue(session("lead", { subteam: MECH }));
    expect(
      (await docPOST(jsonReq("POST", { title: "T", fileUrl: "https://x/y" })))
        .status,
    ).toBe(201);
    expect(
      (
        await docPOST(
          jsonReq("POST", {
            title: "T",
            fileUrl: "https://x/y",
            subteam: ELEC,
          }),
        )
      ).status,
    ).toBe(403);

    authMock.mockResolvedValue(session("admin"));
    expect(
      (await docPOST(jsonReq("POST", { title: "T", fileUrl: "https://x/y" })))
        .status,
    ).toBe(201);
  });

  it("PATCH: member 403; lead own 200; lead other 403; lead move 403; admin 200", async () => {
    authMock.mockResolvedValue(session("member"));
    expect(
      (await docPATCH(jsonReq("PATCH", { title: "X" }), ctx(IDS.doc))).status,
    ).toBe(403);

    authMock.mockResolvedValue(session("lead", { subteam: MECH }));
    DocMock.findById.mockReturnValue(leanQuery(docDoc({ subteam: MECH })));
    expect(
      (await docPATCH(jsonReq("PATCH", { title: "X" }), ctx(IDS.doc))).status,
    ).toBe(200);
    expect(
      (await docPATCH(jsonReq("PATCH", { subteam: ELEC }), ctx(IDS.doc)))
        .status,
    ).toBe(403); // move to another subteam

    DocMock.findById.mockReturnValue(leanQuery(docDoc({ subteam: ELEC })));
    expect(
      (await docPATCH(jsonReq("PATCH", { title: "X" }), ctx(IDS.doc))).status,
    ).toBe(403); // edit another subteam's doc

    authMock.mockResolvedValue(session("admin"));
    DocMock.findById.mockReturnValue(leanQuery(docDoc({ subteam: ELEC })));
    expect(
      (await docPATCH(jsonReq("PATCH", { subteam: MECH }), ctx(IDS.doc)))
        .status,
    ).toBe(200);
  });
});

describe("events (admin+lead write; not subteam-scoped)", () => {
  const ISO = "2026-08-01T10:00:00.000Z";

  it("POST: member 403; admin 201; lead 201", async () => {
    authMock.mockResolvedValue(session("member"));
    expect(
      (await evtPOST(jsonReq("POST", { title: "T", date: ISO }))).status,
    ).toBe(403);
    authMock.mockResolvedValue(session("admin"));
    expect(
      (await evtPOST(jsonReq("POST", { title: "T", date: ISO }))).status,
    ).toBe(201);
    authMock.mockResolvedValue(session("lead", { subteam: MECH }));
    expect(
      (await evtPOST(jsonReq("POST", { title: "T", date: ISO }))).status,
    ).toBe(201);
  });

  it("PATCH: member 403; admin 200", async () => {
    authMock.mockResolvedValue(session("member"));
    expect(
      (await evtPATCH(jsonReq("PATCH", { title: "X" }), ctx(IDS.doc))).status,
    ).toBe(403);
    authMock.mockResolvedValue(session("admin"));
    expect(
      (await evtPATCH(jsonReq("PATCH", { title: "X" }), ctx(IDS.doc))).status,
    ).toBe(200);
  });
});
