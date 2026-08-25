import {describe,expect,it} from "vitest";
import {sanitizeColoringSvg} from "./coloring-svg";
describe("sanitizeColoringSvg",()=>{
 it("identifie les zones fermées d’un dessin sûr",()=>{const result=sanitizeColoringSvg('<svg viewBox="0 0 100 100"><path d="M0 0h50v50z"/><circle cx="70" cy="70" r="20"/></svg>');expect(result.zoneCount).toBe(2);expect(result.svg).toContain('data-color-zone="1"');expect(result.svg).toContain('data-color-zone="2"')});
 it("refuse les scripts et événements",()=>{expect(()=>sanitizeColoringSvg('<svg viewBox="0 0 10 10"><script>alert(1)</script><path d="M0 0z"/><path d="M1 1z"/></svg>')).toThrow(/non autorisé/);expect(()=>sanitizeColoringSvg('<svg viewBox="0 0 10 10"><path onclick="alert(1)" d="M0 0z"/><path d="M1 1z"/></svg>')).toThrow(/non autorisé/)});
 it("refuse les ressources externes et les dessins sans zones",()=>{expect(()=>sanitizeColoringSvg('<svg viewBox="0 0 10 10"><image href="https://example.com/a.png"/></svg>')).toThrow(/non autorisé/);expect(()=>sanitizeColoringSvg('<svg viewBox="0 0 10 10"><line x1="0" y1="0" x2="10" y2="10"/></svg>')).toThrow(/au moins deux zones/)});
});
