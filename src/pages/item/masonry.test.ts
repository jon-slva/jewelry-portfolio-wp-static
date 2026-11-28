import { describe, expect, it } from 'vitest';
import { MASONRY_GAP, MASONRY_ROW_UNIT, masonryCells } from './masonry.ts';

describe('masonryCells', () => {
  it('gives large images two columns and normal images one', () => {
    const cells = masonryCells(
      [
        { aspect: 1, large: true },
        { aspect: 1, large: false },
      ],
      3,
    );
    expect(cells.map((c) => c.colSpan)).toEqual([2, 1]);
  });

  it('never spans more columns than there are', () => {
    expect(masonryCells([{ aspect: 1, large: true }], 1)[0].colSpan).toBe(1);
  });

  it('makes row spans follow the image height plus the gap', () => {
    // Two columns: each column is (100 - gap) / 2 wide; a square image is as tall as wide.
    const columnWidth = (100 - MASONRY_GAP) / 2;
    const [square, wide, tall] = masonryCells(
      [
        { aspect: 1, large: false },
        { aspect: 2, large: false },
        { aspect: 0.5, large: false },
      ],
      2,
    );
    expect(square.rowSpan).toBe(Math.round((columnWidth + MASONRY_GAP) / MASONRY_ROW_UNIT));
    expect(wide.rowSpan).toBeLessThan(square.rowSpan);
    expect(tall.rowSpan).toBeGreaterThan(square.rowSpan);
  });
});
