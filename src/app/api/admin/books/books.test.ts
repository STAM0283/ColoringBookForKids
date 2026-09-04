import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  findBook: vi.fn(),
  findType: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  values: vi.fn(),
  set: vi.fn(),
  where: vi.fn(),
}));
vi.mock("@/auth", () => ({ auth: mocks.auth }));
vi.mock("@/db", () => ({ db: {
  query: { books: { findFirst: mocks.findBook }, activityTypes: { findFirst: mocks.findType } },
  insert: mocks.insert,
  update: mocks.update,
} }));
vi.mock("@/lib/storage/local-storage", () => ({ storageService: {} }));

import { POST } from "./route";
import { PATCH } from "./[id]/route";

const typeId = "b0be1d12-45b2-4028-a1ac-a414be41e975";
const bookId = "df9feafb-f5c8-452e-a23a-7677c4623469";
const fields = {
  language: "FR", title: "Mon livre", shortDescription: "Une histoire pour les enfants.",
  description: "Une belle histoire à lire ensemble.", categoryId: null,
  ageMin: 3, ageMax: 8, pageCount: 12, amazonUrl: "", pricingType: "FREE",
  priceCents: null, published: false, featured: false,
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.auth.mockResolvedValue({ user: { role: "ADMIN" } });
  mocks.findBook.mockResolvedValue({ ...fields, id: bookId, activityTypeId: typeId, coverMediaId: null, pdfMediaId: null });
  mocks.findType.mockResolvedValue({ id: typeId, language: "FR" });
  mocks.insert.mockReturnValue({ values: mocks.values });
  mocks.values.mockResolvedValue(undefined);
  mocks.update.mockReturnValue({ set: mocks.set });
  mocks.set.mockReturnValue({ where: mocks.where });
  mocks.where.mockResolvedValue(undefined);
});

function createRequest(activityTypeId?: string) {
  const form = new FormData();
  Object.entries(fields).forEach(([key, value]) => { if (value !== null) form.set(key, String(value)); });
  if (activityTypeId !== undefined) form.set("activityTypeId", activityTypeId);
  return new Request("http://localhost/api/admin/books", { method: "POST", body: form });
}
function patchRequest(body: object) {
  return new Request(`http://localhost/api/admin/books/${bookId}`, {
    method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(body),
  });
}
const params = () => ({ params: Promise.resolve({ id: bookId }) });

describe("Book activity type persistence", () => {
  it.each(["PUBLIC", "CLUB", "BUYER"])("saves the access policy %s on creation", async accessLevel => {
    const form = await createRequest().formData();
    form.set("accessLevel", accessLevel);
    expect((await POST(new Request("http://localhost/api/admin/books", { method: "POST", body: form }))).status).toBe(201);
    expect(mocks.values).toHaveBeenCalledWith(expect.objectContaining({ accessLevel }));
  });
  it("preserves protected access when an older client omits it", async () => {
    mocks.findBook.mockResolvedValue({ ...fields, id: bookId, activityTypeId: null, accessLevel: "BUYER", coverMediaId: null, pdfMediaId: "existing-pdf" });
    expect((await PATCH(patchRequest({ ...fields, pricingType: "PAID" }), params())).status).toBe(200);
    expect(mocks.set).toHaveBeenCalledWith(expect.objectContaining({ accessLevel: "BUYER", pdfMediaId: "existing-pdf" }));
  });
  it("creates a book with an existing activity type", async () => {
    expect((await POST(createRequest(typeId))).status).toBe(201);
    expect(mocks.values).toHaveBeenCalledWith(expect.objectContaining({ activityTypeId: typeId }));
  });
  it("keeps the activity type optional on creation", async () => {
    expect((await POST(createRequest())).status).toBe(201);
    expect(mocks.values).toHaveBeenCalledWith(expect.objectContaining({ activityTypeId: null }));
    expect(mocks.findType).not.toHaveBeenCalled();
  });
  it("rejects an invalid type identifier", async () => {
    expect((await POST(createRequest("invalid"))).status).toBe(400);
    expect(mocks.insert).not.toHaveBeenCalled();
  });
  it("rejects missing or wrong-language types before writing", async () => {
    mocks.findType.mockResolvedValue(undefined);
    expect((await POST(createRequest(typeId))).status).toBe(400);
    expect(mocks.insert).not.toHaveBeenCalled();
  });
  it("preserves the existing type for clients omitting the field", async () => {
    expect((await PATCH(patchRequest(fields), params())).status).toBe(200);
    expect(mocks.set).toHaveBeenCalledWith(expect.objectContaining({ activityTypeId: typeId }));
  });
  it("allows explicitly removing the type", async () => {
    expect((await PATCH(patchRequest({ ...fields, activityTypeId: null }), params())).status).toBe(200);
    expect(mocks.set).toHaveBeenCalledWith(expect.objectContaining({ activityTypeId: null }));
    expect(mocks.findType).not.toHaveBeenCalled();
  });
  it("saves the type submitted by the multipart edit form", async () => {
    const request = createRequest(typeId);
    const form = await request.formData();
    const edit = new Request(request.url, { method: "PATCH", body: form });
    expect((await PATCH(edit, params())).status).toBe(200);
    expect(mocks.set).toHaveBeenCalledWith(expect.objectContaining({ activityTypeId: typeId }));
  });
  it("rejects a wrong-language type when updating", async () => {
    mocks.findType.mockResolvedValue(undefined);
    expect((await PATCH(patchRequest({ ...fields, language: "EN", activityTypeId: typeId }), params())).status).toBe(400);
    expect(mocks.update).not.toHaveBeenCalled();
  });
  it("requires admin authorization", async () => {
    mocks.auth.mockResolvedValue(null);
    expect((await POST(createRequest(typeId))).status).toBe(401);
    expect((await PATCH(patchRequest(fields), params())).status).toBe(401);
    expect(mocks.insert).not.toHaveBeenCalled();
    expect(mocks.update).not.toHaveBeenCalled();
  });
});
