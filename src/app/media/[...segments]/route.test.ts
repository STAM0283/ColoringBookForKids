import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  auth: vi.fn(), access: vi.fn(), select: vi.fn(),
}));
vi.mock("@/auth", () => ({ auth: mocks.auth }));
vi.mock("@/lib/content-access", () => ({ hasContentAccess: mocks.access }));
vi.mock("@/db", () => ({ db: { select: mocks.select } }));
vi.mock("node:fs/promises", () => ({ stat: async () => ({ isFile: () => true, size: 10 }) }));
vi.mock("node:fs", async () => {
  const { Readable } = await import("node:stream");
  return { default: { createReadStream: () => Readable.from([Buffer.from("PDF")]) } };
});
import { GET } from "./route";
type Record = { published: boolean; accessLevel: string; id?: string; accessBookId?: string | null; downloadEnabled?: boolean };
function records(activities: Record[] = [], books: Record[] = []) {
  let call = 0;
  mocks.select.mockImplementation(() => ({
    from: () => ({ innerJoin: () => ({ where: async () => (call++ === 0 ? activities : books).map(item => ({ item })) }) }),
  }));
}
function get(range = false) {
  return GET(new Request("http://localhost/media/test.pdf", { headers: range ? { Range: "bytes=0-2" } : {} }), { params: Promise.resolve({ segments: ["test.pdf"] }) });
}
beforeEach(() => {
  vi.clearAllMocks(); mocks.auth.mockResolvedValue(null); mocks.access.mockResolvedValue(false);
});
describe("Direct PDF URL protection", () => {
  it("blocks a restricted book without its code", async () => {
    records([], [{ id: "book-a", published: true, accessLevel: "BUYER" }]);
    const response = await get();
    expect(response.status).toBe(403);
    expect(mocks.access).toHaveBeenCalledWith("BUYER", "book-a");
    expect(response.headers.get("Cache-Control")).toContain("no-store");
  });
  it("blocks activity bonuses using the linked book scope", async () => {
    records([{ published: true, downloadEnabled: true, accessLevel: "BUYER", accessBookId: "book-a" }]);
    expect((await get()).status).toBe(403);
    expect(mocks.access).toHaveBeenCalledWith("BUYER", "book-a");
  });
  it("blocks unpublished PDFs even with a valid code", async () => {
    mocks.access.mockResolvedValue(true);
    records([], [{ published: false, accessLevel: "PUBLIC" }]);
    expect((await get()).status).toBe(403);
  });
  it("honors the activity download-disabled setting", async () => {
    mocks.access.mockResolvedValue(true);
    records([{ published: true, downloadEnabled: false, accessLevel: "PUBLIC" }]);
    expect((await get()).status).toBe(403);
  });
  it("checks authorization on range requests too", async () => {
    records([], [{ published: true, accessLevel: "CLUB" }]);
    expect((await get(true)).status).toBe(403);
  });
  it("allows valid sessions and prevents reusable public caching", async () => {
    mocks.access.mockResolvedValue(true);
    records([], [{ id: "book-a", published: true, accessLevel: "BUYER" }]);
    const response = await get(true);
    expect(response.status).toBe(206);
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
    await response.body?.cancel();
  });
  it("allows administrators to preview restricted drafts", async () => {
    mocks.auth.mockResolvedValue({ user: { role: "ADMIN" } });
    records([], [{ published: false, accessLevel: "BUYER" }]);
    const response = await get();
    expect(response.status).toBe(200);
    expect(mocks.access).not.toHaveBeenCalled();
    await response.body?.cancel();
  });
});
