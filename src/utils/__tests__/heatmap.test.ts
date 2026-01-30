import { describe, it, expect } from 'vitest';
import { getHeatmapBucket } from '../heatmap';

describe('getHeatmapBucket', () => {
  it('maps counts to relative buckets (max=8)', () => {
    expect(getHeatmapBucket(0, 8)).toBe(0);
    expect(getHeatmapBucket(2, 8)).toBe(1);
    expect(getHeatmapBucket(4, 8)).toBe(2);
    expect(getHeatmapBucket(6, 8)).toBe(3);
    expect(getHeatmapBucket(8, 8)).toBe(4);
  });

  it('treats maxCount<=0 as bucket 0', () => {
    expect(getHeatmapBucket(1, 0)).toBe(0);
    expect(getHeatmapBucket(10, -1)).toBe(0);
  });

  it('is monotonic for a fixed maxCount', () => {
    const max = 12;
    let last = 0;
    for (let c = 0; c <= max; c += 1) {
      const b = getHeatmapBucket(c, max);
      expect(b).toBeGreaterThanOrEqual(last);
      last = b;
    }
  });
});
