import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock the Backend-owned collaborators so authorize runs without a real DB.
vi.mock("@/lib/db/connect", () => ({
  connectToDatabase: vi.fn().mockResolvedValue({}),
}));
vi.mock("@/lib/utils/password", () => ({
  verifyPassword: vi.fn(),
}));
vi.mock("@/models/User", () => ({
  User: { findOne: vi.fn() },
}));

import { connectToDatabase } from "@/lib/db/connect";
import { verifyPassword } from "@/lib/utils/password";
import { User } from "@/models/User";
import { authorizeCredentials } from "@/lib/auth/authorize";

const connectMock = vi.mocked(connectToDatabase);
const verifyMock = vi.mocked(verifyPassword);
const findOneMock = vi.mocked(User.findOne);

/** Build the `.select().lean()` chain that authorize expects, resolving to `record`. */
function mockUserQuery(record: unknown) {
  const lean = vi.fn().mockResolvedValue(record);
  const select = vi.fn().mockReturnValue({ lean });
  findOneMock.mockReturnValue({ select } as never);
  return { select, lean };
}

const activeUser = {
  _id: "665f1c2e9a3b4c1d2e3f4a5b",
  name: "Ada Yılmaz",
  email: "ada@example.com",
  passwordHash: "$2a$12$hash",
  role: "lead" as const,
  subteam: "software",
  active: true,
};

beforeEach(() => {
  vi.clearAllMocks();
  connectMock.mockResolvedValue({} as never);
});

describe("authorizeCredentials", () => {
  it("returns the user on valid credentials", async () => {
    mockUserQuery(activeUser);
    verifyMock.mockResolvedValue(true);

    const result = await authorizeCredentials({
      email: "ada@example.com",
      password: "correct-horse",
    });

    expect(result).toEqual({
      id: "665f1c2e9a3b4c1d2e3f4a5b",
      email: "ada@example.com",
      name: "Ada Yılmaz",
      role: "lead",
      subteam: "software",
    });
  });

  it("explicitly selects the select:false passwordHash field", async () => {
    const { select } = mockUserQuery(activeUser);
    verifyMock.mockResolvedValue(true);

    await authorizeCredentials({ email: "ada@example.com", password: "x" });

    expect(select).toHaveBeenCalledWith("+passwordHash");
  });

  it("normalises the email (trim + lowercase) before lookup", async () => {
    mockUserQuery(activeUser);
    verifyMock.mockResolvedValue(true);

    await authorizeCredentials({
      email: "  ADA@Example.com  ",
      password: "x",
    });

    expect(findOneMock).toHaveBeenCalledWith({ email: "ada@example.com" });
  });

  it("rejects an inactive account (returns null)", async () => {
    mockUserQuery({ ...activeUser, active: false });
    verifyMock.mockResolvedValue(true);

    expect(
      await authorizeCredentials({ email: "ada@example.com", password: "x" }),
    ).toBeNull();
    // Password is never even checked for a disabled account.
    expect(verifyMock).not.toHaveBeenCalled();
  });

  it("rejects an unknown email (returns null)", async () => {
    mockUserQuery(null);

    expect(
      await authorizeCredentials({ email: "ghost@example.com", password: "x" }),
    ).toBeNull();
    expect(verifyMock).not.toHaveBeenCalled();
  });

  it("rejects a wrong password (returns null)", async () => {
    mockUserQuery(activeUser);
    verifyMock.mockResolvedValue(false);

    expect(
      await authorizeCredentials({
        email: "ada@example.com",
        password: "nope",
      }),
    ).toBeNull();
  });

  it("returns null without touching the DB when fields are missing", async () => {
    expect(await authorizeCredentials({ email: "", password: "" })).toBeNull();
    expect(await authorizeCredentials({})).toBeNull();
    expect(connectMock).not.toHaveBeenCalled();
    expect(findOneMock).not.toHaveBeenCalled();
  });

  it("fails closed (null) when the DB layer throws", async () => {
    connectMock.mockRejectedValue(new Error("no MONGODB_URI"));

    expect(
      await authorizeCredentials({ email: "ada@example.com", password: "x" }),
    ).toBeNull();
  });
});
