import type { ImageInfo, VideoInfo } from '../../content/media.ts';
import type { Grid } from '../../content/schema.ts';

/** What one grid tile needs, prepared by the page's loader. */
export interface GridTile {
  slug: string;
  title: string;
  /** Double-size tile. */
  featured: boolean;
  cover: ImageInfo | undefined;
  /** Looping video shown instead of the cover image, with the cover as its poster. */
  coverVideo: VideoInfo | undefined;
}

export interface PortfolioGridProps {
  tiles: GridTile[];
  /** Tiles per row and spacing, from grid.json. */
  columns: Grid['columns'];
  gap: number;
}
