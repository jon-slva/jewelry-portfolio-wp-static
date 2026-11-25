import { itemSchema, siteSchema } from '../../src/content/schema.ts';
import type { ContentSnapshot } from '../lib/content-files.ts';

/**
 * Every image and video file the content refers to, split by kind.
 * Invalid content files are skipped (npm run validate reports them), and so
 * are paths whose file doesn't exist.
 */
export function collectMediaPaths(content: ContentSnapshot): {
  images: string[];
  videos: string[];
} {
  const images = new Set<string>();
  const videos = new Set<string>();

  const site = siteSchema.safeParse(content.site.data);
  if (site.success) images.add(site.data.resume.preview);

  for (const file of content.items) {
    const parsed = itemSchema.safeParse(file.data);
    if (!parsed.success) continue;
    const item = parsed.data;
    images.add(item.cover);
    if (item.coverVideo) videos.add(item.coverVideo);
    for (const media of item.media) {
      if (media.type === 'image') images.add(media.file);
      if (media.type === 'video') {
        videos.add(media.file);
        images.add(media.poster);
      }
    }
  }

  const existing = (paths: Set<string>) =>
    [...paths].filter((p) => content.mediaFiles.has(p)).sort();
  return { images: existing(images), videos: existing(videos) };
}
