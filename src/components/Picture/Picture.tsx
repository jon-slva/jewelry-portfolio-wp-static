import { srcSet } from '../../content/media.ts';
import type { PictureProps } from './Picture.types.ts';

/**
 * A responsive, lazy-loading image built by `npm run images`.
 *
 * The browser picks the smallest WebP that looks sharp at the displayed size
 * (srcset + sizes). Older browsers get the JPEG. Width and height reserve the
 * space up front, and the image's main color fills it until the file arrives.
 */
export default function Picture({
  image,
  alt,
  sizes = '100vw',
  priority = false,
  className,
}: PictureProps) {
  if (!image) {
    if (import.meta.env.DEV) console.warn('Picture: no image data. Has `npm run images` run?');
    return null;
  }
  const base = import.meta.env.BASE_URL;

  return (
    <picture className={className}>
      <source type="image/webp" srcSet={srcSet(image.webp, base)} sizes={sizes} />
      <img
        src={`${base}${image.fallback}`}
        width={image.width}
        height={image.height}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : undefined}
        decoding="async"
        style={{ backgroundColor: image.color }}
      />
    </picture>
  );
}
