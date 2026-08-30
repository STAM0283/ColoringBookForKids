export type ColoringRegion = {
  id: number;
  size: number;
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
};

export type ColoringRegionMap = {
  width: number;
  height: number;
  labels: Int32Array;
  regions: Array<ColoringRegion | undefined>;
};

const LINE_LUMINANCE = 215;
const LINE_DILATION_RADIUS = 2;
const MIN_REGION_SIZE = 4;

export function buildColoringRegionMap(
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
): ColoringRegionMap {
  const total = width * height;
  const lines = new Uint8Array(total);

  for (let position = 0; position < total; position++) {
    const offset = position * 4;
    const luminance = pixels[offset] * 0.2126 + pixels[offset + 1] * 0.7152 + pixels[offset + 2] * 0.0722;
    if (pixels[offset + 3] > 16 && luminance < LINE_LUMINANCE) lines[position] = 1;
  }

  // A small virtual dilation closes JPEG/anti-aliasing gaps and joins thin
  // grey outlines without changing the image displayed to the child.
  const blocked = lines.slice();
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const position = y * width + x;
      if (!lines[position]) continue;
      for (let dy = -LINE_DILATION_RADIUS; dy <= LINE_DILATION_RADIUS; dy++) {
        const nextY = y + dy;
        if (nextY < 0 || nextY >= height) continue;
        for (let dx = -LINE_DILATION_RADIUS; dx <= LINE_DILATION_RADIUS; dx++) {
          const nextX = x + dx;
          if (nextX >= 0 && nextX < width) blocked[nextY * width + nextX] = 1;
        }
      }
    }
  }

  const labels = new Int32Array(total);
  const queue = new Int32Array(total);
  const regions: Array<ColoringRegion | undefined> = [undefined];
  let regionId = 0;

  for (let start = 0; start < total; start++) {
    if (blocked[start] || labels[start]) continue;
    regionId++;
    let head = 0;
    let tail = 1;
    let size = 0;
    let minX = width;
    let minY = height;
    let maxX = 0;
    let maxY = 0;
    queue[0] = start;
    labels[start] = regionId;

    while (head < tail) {
      const position = queue[head++];
      const x = position % width;
      const y = Math.floor(position / width);
      size++;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;

      const left = position - 1;
      const right = position + 1;
      const up = position - width;
      const down = position + width;
      if (x > 0 && !blocked[left] && !labels[left]) { labels[left] = regionId; queue[tail++] = left; }
      if (x + 1 < width && !blocked[right] && !labels[right]) { labels[right] = regionId; queue[tail++] = right; }
      if (y > 0 && !blocked[up] && !labels[up]) { labels[up] = regionId; queue[tail++] = up; }
      if (y + 1 < height && !blocked[down] && !labels[down]) { labels[down] = regionId; queue[tail++] = down; }
    }

    regions[regionId] = { id: regionId, size, minX, minY, maxX, maxY };
  }

  return { width, height, labels, regions };
}

export function isColorableRegion(map: ColoringRegionMap, regionId: number) {
  const region = map.regions[regionId];
  return Boolean(region && region.size >= MIN_REGION_SIZE);
}

export function findColoringRegion(map: ColoringRegionMap, x: number, y: number, radius: number) {
  const direct = map.labels[y * map.width + x] || 0;
  if (isColorableRegion(map, direct)) return direct;

  const limit = Math.max(1, Math.min(24, Math.round(radius)));
  for (let distance = 1; distance <= limit; distance++) {
    const candidates = new Map<number, number>();
    const count = (sampleX: number, sampleY: number) => {
      if (sampleX < 0 || sampleY < 0 || sampleX >= map.width || sampleY >= map.height) return;
      const id = map.labels[sampleY * map.width + sampleX] || 0;
      if (isColorableRegion(map, id)) candidates.set(id, (candidates.get(id) || 0) + 1);
    };
    for (let offset = -distance; offset <= distance; offset++) {
      count(x + offset, y - distance);
      count(x + offset, y + distance);
      if (Math.abs(offset) !== distance) {
        count(x - distance, y + offset);
        count(x + distance, y + offset);
      }
    }
    if (candidates.size) return [...candidates].sort((first, second) => second[1] - first[1])[0][0];
  }
  return 0;
}
