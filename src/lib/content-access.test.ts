import { beforeEach, describe, expect, it, vi } from "vitest";
const { session } = vi.hoisted(() => ({ session: vi.fn() }));
vi.mock("./club-access", () => ({ getClubSession: session }));
import { hasContentAccess } from "./content-access";

beforeEach(() => { session.mockReset(); session.mockResolvedValue(null); });
describe("PDF access boundaries", () => {
  it("allows public access without a session", async () => {
    expect(await hasContentAccess("PUBLIC")).toBe(true);
    expect(session).not.toHaveBeenCalled();
  });
  it("requires a Club session for Club content", async () => {
    expect(await hasContentAccess("CLUB")).toBe(false);
    session.mockResolvedValue({ id: "club-session" });
    expect(await hasContentAccess("CLUB")).toBe(true);
    expect(session).toHaveBeenLastCalledWith();
  });
  it("requires the exact book entitlement for buyer bonuses", async () => {
    session.mockImplementation(async (id?: string) => id === "book-a" ? { id: "buyer-session" } : null);
    expect(await hasContentAccess("BUYER", "book-a")).toBe(true);
    expect(await hasContentAccess("BUYER", "book-b")).toBe(false);
    expect(await hasContentAccess("CLUB")).toBe(false);
  });
  it("fails closed when the linked book is deleted", async () => {
    session.mockResolvedValue({ id: "some-session" });
    expect(await hasContentAccess("BUYER", null)).toBe(false);
    expect(session).not.toHaveBeenCalled();
  });
});
