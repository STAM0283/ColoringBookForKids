import { describe, expect, it } from "vitest";
import { readingTimeLabel, readingTimeMinutes } from "./reading-time";

describe("reading time", () => {
  it("ignores Markdown syntax and rounds up", () => {
    expect(readingTimeMinutes("# Titre\n\n**Deux** mots [avec un lien](https://example.com)")).toBe(1);
    expect(readingTimeMinutes(Array.from({length: 221}, (_, index) => `mot${index}`).join(" "))).toBe(2);
  });
  it("returns localized labels", () => {
    expect(readingTimeLabel("Un article", "fr")).toBe("1 min de lecture");
    expect(readingTimeLabel("An article", "en")).toBe("1 min read");
  });
});
