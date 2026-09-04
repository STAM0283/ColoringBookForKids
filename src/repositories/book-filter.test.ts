import { beforeEach, describe, expect, it, vi } from "vitest";

const { query } = vi.hoisted(() => ({ query: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/db", async () => {
  const { drizzle } = await import("drizzle-orm/node-postgres");
  const schema = await import("@/db/schema");
  return { db: drizzle({ client: { query } as unknown as import("pg").Pool, schema }) };
});

import { contentRepository } from "./content.repository";

beforeEach(() => {
  query.mockReset();
  query.mockImplementation(async (config: { text: string }) => ({
    rows: config.text.includes("count(*)") ? [[0]] : [],
  }));
});

describe("Public book activity-type filtering", () => {
  it.each(["FR", "EN"] as const)("only offers categories linked to a published book in %s", async language => {
    await contentRepository.bookCategories(language);
    expect(query).toHaveBeenCalledTimes(1);
    const [config, values] = query.mock.calls[0];
    expect(config.text).toContain('exists (select');
    expect(config.text).toContain('"books"."category_id" = "categories"."id"');
    expect(config.text).toContain('"books"."published" =');
    expect(config.text).toContain('"books"."language" =');
    expect(config.text).toContain('"categories"."language" =');
    expect(values).toEqual([language, "BOOK", "ACTIVITY", true, language]);
  });

  it.each(["FR", "EN"] as const)("filters both results and total by type and language (%s)", async language => {
    const result = await contentRepository.books({
      activityType: "coloring", language, search: "story", pricing: "FREE", category: "animals", page: 2, pageSize: 12,
    });
    expect(result.total).toBe(0);
    expect(query).toHaveBeenCalledTimes(2);
    for (const [config, values] of query.mock.calls) {
      expect(config.text).toContain('"books"."activity_type_id" in (select');
      expect(config.text).toContain('"activity_types"."slug"');
      expect(config.text).toContain('"activity_types"."language"');
      expect(values).toEqual(expect.arrayContaining([language, "coloring", "%story%", "FREE", "animals"]));
    }
    const listCall = query.mock.calls.find(([config]) => !config.text.includes("count(*)"));
    expect(listCall?.[1].slice(-2)).toEqual([12, 12]);
  });
  it("keeps untyped books in the unfiltered collection", async () => {
    await contentRepository.books();
    for (const [config, values] of query.mock.calls) {
      expect(config.text).not.toContain('from "activity_types"');
      expect(config.text).not.toContain('"activity_type_id" is not null');
      expect(values).toContain("FR");
    }
  });
});
