import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db/connect", () => ({
  connectToDatabase: vi.fn().mockResolvedValue({}),
}));
vi.mock("@/models/Sponsor", () => ({ Sponsor: { find: vi.fn() } }));

import { Sponsor } from "@/models/Sponsor";
import { GET as publicSponsorsGET } from "@/app/api/sponsors/route";

import { asMock, leanQuery } from "./_panel";

const SponsorMock = asMock(Sponsor);

/**
 * The public sponsors endpoint must never leak inactive (unpublished) sponsors —
 * it queries strictly `{ active: true }`. This guards the CMS publish boundary:
 * an admin un-publishing a sponsor (active:false in the panel) removes it from
 * the public site.
 */
describe("public GET /api/sponsors — no leak of inactive sponsors", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    SponsorMock.find.mockReturnValue(leanQuery([]));
  });

  it("queries only active sponsors and returns 200", async () => {
    const res = await publicSponsorsGET();
    expect(res.status).toBe(200);
    expect(SponsorMock.find).toHaveBeenCalledTimes(1);
    expect(SponsorMock.find).toHaveBeenCalledWith({ active: true });
  });
});
