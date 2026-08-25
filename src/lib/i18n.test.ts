import { describe, expect, it } from "vitest";
import { switchLocalePath } from "./i18n";

describe("switchLocalePath", () => {
  it.each([
    ["/", "en", "/en"],
    ["/livres", "en", "/en/books"],
    ["/activites", "en", "/en/activities"],
    ["/videos", "en", "/en/videos"],
    ["/images", "en", "/en/images"],
    ["/blog", "en", "/en/blog"],
    ["/a-propos", "en", "/en/about"],
    ["/en", "fr", "/"],
    ["/en/books", "fr", "/livres"],
    ["/en/activities", "fr", "/activites"],
    ["/en/videos", "fr", "/videos"],
    ["/en/images", "fr", "/images"],
    ["/en/blog", "fr", "/blog"],
    ["/en/about", "fr", "/a-propos"],
  ] as const)("converts %s to %s", (pathname, locale, expected) => {
    expect(switchLocalePath(pathname, locale)).toBe(expected);
  });

  it("returns to the translated list when a detail slug cannot be paired safely", () => {
    expect(switchLocalePath("/en/books/an-english-book", "fr")).toBe("/livres");
    expect(switchLocalePath("/blog/un-article", "en")).toBe("/en/blog");
  });

  it("never creates a protocol-relative URL", () => {
    for (const path of ["/en/books", "/en/activities", "/en/videos", "/en/images", "/en/blog", "/en/about"]) {
      expect(switchLocalePath(path, "fr")).not.toMatch(/^\/\//);
    }
  });
});
