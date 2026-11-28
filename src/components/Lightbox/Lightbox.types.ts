import type { ImageInfo } from '../../content/media.ts';

export interface LightboxImage {
  image: ImageInfo;
  alt: string;
}

export interface LightboxProps {
  images: LightboxImage[];
  /** Which image is open, or null when the lightbox is closed. */
  index: number | null;
  onIndexChange: (index: number | null) => void;
}
