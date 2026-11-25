// Masonry placement for the item page, worked out from each image's shape so
// it needs no JavaScript in the browser and is already right in the
// pre-rendered HTML.
//
// The grid is a CSS grid with very short rows (ROW_UNIT). Each image spans as
// many rows as its height needs, and `grid-auto-flow: dense` drops each one
// into the highest free spot, which is what a masonry layout does. All sizes
// are in % of the grid's width (CSS `cqw` units), so the layout scales with
// the screen without recalculating.

/** Space between images, in % of the grid width (about 10px at 900px). */
export const MASONRY_GAP = 1.1;

/** Height of one grid row, in % of the grid width. Smaller = more precise. */
export const MASONRY_ROW_UNIT = 0.5;

export interface MasonryInput {
  /** Width ÷ height of the image. */
  aspect: number;
  /** Large images span two columns. */
  large: boolean;
}

export interface MasonryCell {
  colSpan: number;
  rowSpan: number;
}

export function masonryCells(items: MasonryInput[], columns: number): MasonryCell[] {
  const columnWidth = (100 - (columns - 1) * MASONRY_GAP) / columns;
  return items.map(({ aspect, large }) => {
    const colSpan = large ? Math.min(2, columns) : 1;
    const width = colSpan * columnWidth + (colSpan - 1) * MASONRY_GAP;
    const height = width / aspect;
    // The gap below the image is part of the cell.
    const rowSpan = Math.max(1, Math.round((height + MASONRY_GAP) / MASONRY_ROW_UNIT));
    return { colSpan, rowSpan };
  });
}
