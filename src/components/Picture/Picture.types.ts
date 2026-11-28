import type { ImageInfo } from '../../content/media.ts';

export interface PictureProps {
  /** From getImage() in src/content. Renders nothing when missing. */
  image: ImageInfo | undefined;
  alt: string;
  /**
   * How wide the image is shown, so the browser can pick the right file.
   * Example: "(min-width: 1024px) 33vw, 100vw". Defaults to the full screen width.
   */
  sizes?: string;
  /** For the main image at the top of a page: load it right away instead of lazily. */
  priority?: boolean;
  className?: string;
}
