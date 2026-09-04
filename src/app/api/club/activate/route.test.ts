import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  select: vi.fn(), transaction: vi.fn(), setCookie: vi.fn(), cookie: vi.fn(),
}));
vi.mock("next/headers", () => ({ cookies: async () => ({ set: mocks.setCookie }) }));
vi.mock("@/db", () => ({ db: { select: mocks.select, transaction: mocks.transaction } }));
vi.mock("@/lib/rate-limit", () => ({ consumeAttempt: () => ({ allowed: true }), clearAttempts: vi.fn() }));
vi.mock("@/lib/club-access", () => ({
  CLUB_COOKIE: "club", buyerCookie: (id: string) => "buyer-" + id,
  createClubSessionToken: () => "token", hashClubValue: (value: string) => value,
  normalizeClubCode: (value: string) => value,
}));
import { POST } from "./route";
const bookA = "da0e0189-47e4-49a5-84d9-538caec50e98";
const bookB = "b91bfb16-c156-4b31-b798-fa42437292cd";
function setupCode(bookId: string | null) {
  const limit = vi.fn().mockResolvedValue([{ id: "code", bookId, accessDurationMinutes: 60 }]);
  mocks.select.mockReturnValue({ from: () => ({ where: () => ({ limit }) }) });
}
function request(bookId?: string | null) {
  return new Request("http://localhost/api/club/activate", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ code: "CRAYON-AAAA-BBBB", bookId }) });
}
beforeEach(() => {
  vi.clearAllMocks();
  mocks.transaction.mockResolvedValue(undefined);
});
describe("Access code activation scope", () => {
  it("does not consume a buyer code in the Club flow", async () => {
    setupCode(bookA);
    expect((await POST(request())).status).toBe(403);
    expect(mocks.transaction).not.toHaveBeenCalled();
    expect(mocks.setCookie).not.toHaveBeenCalled();
  });
  it("does not consume a code intended for a different book", async () => {
    setupCode(bookA);
    expect((await POST(request(bookB))).status).toBe(403);
    expect(mocks.transaction).not.toHaveBeenCalled();
  });
  it("does not grant buyer access with a Club code", async () => {
    setupCode(null);
    expect((await POST(request(bookA))).status).toBe(403);
    expect(mocks.transaction).not.toHaveBeenCalled();
  });
  it("keeps buyer cookies separate from the Club cookie", async () => {
    setupCode(bookA);
    expect((await POST(request(bookA))).status).toBe(200);
    expect(mocks.setCookie).toHaveBeenCalledWith("buyer-" + bookA, "token", expect.objectContaining({ httpOnly: true, sameSite: "lax" }));
  });
  it("preserves existing Club activations", async () => {
    setupCode(null);
    expect((await POST(request())).status).toBe(200);
    expect(mocks.setCookie).toHaveBeenCalledWith("club", "token", expect.anything());
  });
  it("sets no cookie if the code was consumed concurrently", async () => {
    setupCode(bookA); mocks.transaction.mockRejectedValue(new Error("CODE_ALREADY_USED"));
    expect((await POST(request(bookA))).status).toBe(409);
    expect(mocks.setCookie).not.toHaveBeenCalled();
  });
});
