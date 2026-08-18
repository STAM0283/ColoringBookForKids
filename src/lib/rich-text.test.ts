import { describe, expect, it } from "vitest";
import { articleContentToHtml } from "./rich-text";

describe("articleContentToHtml", () => {
  it("neutralise les scripts et attributs dangereux", () => {
    const html = articleContentToHtml(
      '<script>alert(1)</script><p onclick="alert(2)">Texte</p><a href="javascript:alert(3)">Lien</a>',
    );

    expect(html).not.toContain("<script");
    expect(html).not.toContain("onclick");
    expect(html).not.toContain("javascript:");
    expect(html).toContain("Texte");
  });
});
