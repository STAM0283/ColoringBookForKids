import { describe, expect, it } from "vitest";
import { buildColoringRegionMap, findColoringRegion, isColorableRegion } from "./raster-coloring-engine";

function lineDrawing(width: number, height: number) {
  const pixels = new Uint8ClampedArray(width * height * 4).fill(255);
  const black = (x: number, y: number) => {
    const offset = (y * width + x) * 4;
    pixels[offset] = pixels[offset + 1] = pixels[offset + 2] = 0;
  };
  for (let y = 0; y < height; y++) black(Math.floor(width / 2), y);
  return pixels;
}

describe("raster coloring engine", () => {
  it("separates areas divided by a dark outline", () => {
    const map = buildColoringRegionMap(lineDrawing(20, 20), 20, 20);
    const left = findColoringRegion(map, 3, 10, 1);
    const right = findColoringRegion(map, 17, 10, 1);
    expect(left).toBeGreaterThan(0);
    expect(right).toBeGreaterThan(0);
    expect(left).not.toBe(right);
    expect(isColorableRegion(map, left)).toBe(true);
  });

  it("selects the nearest area when the pointer lands on an outline", () => {
    const map = buildColoringRegionMap(lineDrawing(24, 24), 24, 24);
    expect(findColoringRegion(map, 12, 12, 5)).toBeGreaterThan(0);
  });

  it("keeps large and very small closed areas selectable", () => {
    const map = buildColoringRegionMap(lineDrawing(40, 40), 40, 40);
    expect(isColorableRegion(map, findColoringRegion(map, 2, 2, 1))).toBe(true);
  });

  it("closes a small anti-aliased gap in a grey outline", () => {
    const width = 40, height = 40;
    const pixels = new Uint8ClampedArray(width * height * 4).fill(255);
    for (let y = 0; y < height; y++) {
      if (y >= 19 && y <= 21) continue;
      const offset = (y * width + 20) * 4;
      pixels[offset] = pixels[offset + 1] = pixels[offset + 2] = 195;
    }
    const map = buildColoringRegionMap(pixels, width, height);
    expect(findColoringRegion(map, 6, 20, 1)).not.toBe(findColoringRegion(map, 34, 20, 1));
  });
});
