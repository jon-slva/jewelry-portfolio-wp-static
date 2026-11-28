// Web-ready media data shared by the media build step (scripts/images/),
// which writes it to src/generated/media.json, and the site, which reads it.
//
// For every image the content uses, `npm run images` writes WebP copies at a
// few widths plus one JPEG fallback into public/img/, and records them:
//
//   "media/reza-ruban-ring/1.png": {
//     "width": 3300, "height": 2550, "color": "#1c1c1c",
//     "webp": [{ "width": 400, "url": "img/reza-ruban-ring/1-400.webp" }, ...],
//     "fallback": "img/reza-ruban-ring/1.jpg"
//   }
//
// Videos (.mp4) and other files (the resume PDF) are already web-ready, so
// they're copied as they are.

/** Target widths in pixels. Covers grid tiles up to full-screen images on high-density screens. */
export const IMAGE_WIDTHS = [400, 800, 1200, 1920];

/** Animated images are large, so they get fewer, smaller sizes. */
export const ANIMATED_WIDTHS = [400, 800];

/** Width of the single JPEG fallback (for browsers without WebP). */
export const FALLBACK_WIDTH = 1200;

export interface ImageVariant {
  width: number;
  /** Relative to the site's base path, e.g. "img/ring/front-800.webp". */
  url: string;
}

export interface ImageInfo {
  /** Size of the original, used to reserve space before the image loads. */
  width: number;
  height: number;
  /** Main color of the image, shown as the background while it loads. */
  color: string;
  animated: boolean;
  /** Smallest first. */
  webp: ImageVariant[];
  fallback: string;
  /** Fingerprint of the original file, so unchanged images aren't rebuilt. */
  hash: string;
}

export interface VideoInfo {
  /** Relative to the site's base path, e.g. "img/ring/turnaround.mp4". */
  url: string;
  hash: string;
}

/** A file copied as it is (e.g. the resume PDF). */
export type FileInfo = VideoInfo;

/** Everything `npm run images` produced, keyed by content path ("media/<folder>/<file>"). */
export interface MediaManifest {
  images: Record<string, ImageInfo>;
  videos: Record<string, VideoInfo>;
  files: Record<string, FileInfo>;
}

/**
 * Widths to generate for an original of the given width: each target width
 * that's smaller than the original, plus the original width itself when it's
 * below the largest target. Images are never enlarged.
 */
export function variantWidths(sourceWidth: number, targets: number[] = IMAGE_WIDTHS): number[] {
  const widths = targets.filter((width) => width < sourceWidth);
  if (sourceWidth <= targets[targets.length - 1]) widths.push(sourceWidth);
  return widths;
}

/** The `srcset` attribute value: "…/front-400.webp 400w, …/front-800.webp 800w". */
export function srcSet(variants: ImageVariant[], basePath: string): string {
  return variants.map((variant) => `${basePath}${variant.url} ${variant.width}w`).join(', ');
}

/** The smallest variant at least `minWidth` wide, or the largest there is. */
export function pickVariant(variants: ImageVariant[], minWidth: number): ImageVariant | undefined {
  return variants.find((variant) => variant.width >= minWidth) ?? variants[variants.length - 1];
}
