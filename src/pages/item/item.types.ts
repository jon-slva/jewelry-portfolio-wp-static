import type { ImageInfo, VideoInfo } from '../../content/media.ts';
import type { Layout, MediaSize, Term } from '../../content/schema.ts';

// Shapes the item page passes between its loader and its components.

/** One gallery entry, with its web files already looked up by the loader. */
export type ItemMedia =
  | { type: 'image'; key: string; alt: string; size: MediaSize; image: ImageInfo }
  | {
      type: 'video';
      key: string;
      alt: string;
      size: MediaSize;
      video: VideoInfo;
      poster: ImageInfo | undefined;
    }
  | { type: 'youtube'; key: string; title: string; size: MediaSize; id: string };

export interface ItemMediaProps {
  media: ItemMedia[];
  layout: Layout;
  /** Opens the lightbox at this image (index among the images only). */
  onOpenImage: (imageIndex: number) => void;
}

export interface MediaTileProps {
  media: ItemMedia;
  /** `sizes` value for images: how wide this tile is shown. */
  sizes: string;
  /** Position among the images, for the lightbox; undefined for videos. */
  imageIndex?: number;
  imageCount: number;
  /** Load right away (the first image on the page). */
  priority?: boolean;
  onOpenImage: (imageIndex: number) => void;
}

export interface ItemDetailsProps {
  title: string;
  subtitle: string;
  description: string;
  software: string[];
  client: string;
  categories: Term[];
  tags: Term[];
}
