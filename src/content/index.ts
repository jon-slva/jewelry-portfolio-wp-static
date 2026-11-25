import categoriesData from './categories.json';
import gridData from './grid.json';
import tagsData from './tags.json';
import type { ImageInfo, MediaManifest, VideoInfo } from './media.ts';
import type { Grid, Item, Term } from './schema.ts';

// The site's single way into src/content/. Use it from route loaders, which
// run at build time when pages are pre-rendered, so the full content and image
// list don't end up in the JavaScript sent to visitors.
//
// The files are trusted here: `npm run validate` checks them before every build.

// import.meta.glob (a Vite feature) imports every matching file at build time.
const itemFiles = import.meta.glob<Item>('./items/*.json', { eager: true, import: 'default' });

// Written by `npm run images`. A glob instead of a plain import so a fresh
// checkout still type-checks before the media has been built.
const manifestFiles = import.meta.glob<MediaManifest>('../generated/media.json', {
  eager: true,
  import: 'default',
});
const manifest: MediaManifest = Object.values(manifestFiles)[0] ?? { images: {}, videos: {} };

export const items: Item[] = Object.values(itemFiles);
export const grid = gridData as Grid;
export const categories: Term[] = categoriesData;
export const tags: Term[] = tagsData;

/** A published item by slug. Drafts are treated as missing. */
export function getItem(slug: string): Item | undefined {
  return items.find((item) => item.slug === slug && !item.draft);
}

/** Responsive image data for a content path like "media/ring/front.jpg". */
export function getImage(path: string): ImageInfo | undefined {
  return manifest.images[path];
}

/** Web address data for a video like "media/ring/turnaround.mp4". */
export function getVideo(path: string): VideoInfo | undefined {
  return manifest.videos[path];
}

/** Image data for several paths, keyed by path, for passing from a loader to a page. */
export function getImages(paths: string[]): Record<string, ImageInfo> {
  return Object.fromEntries(
    paths.flatMap((path) => {
      const image = getImage(path);
      return image ? [[path, image]] : [];
    }),
  );
}

/** Video data for several paths, keyed by path, for passing from a loader to a page. */
export function getVideos(paths: string[]): Record<string, VideoInfo> {
  return Object.fromEntries(
    paths.flatMap((path) => {
      const video = getVideo(path);
      return video ? [[path, video]] : [];
    }),
  );
}
