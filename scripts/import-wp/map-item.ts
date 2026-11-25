import type { ImageMedia, Item, Layout, YoutubeMedia } from '../../src/content/schema.ts';
import { extractItemText } from './content-text.ts';
import { phpUnserialize, type PhpValue } from './php-unserialize.ts';
import type { LegacyItemPage, MediaCopy, WxrExport, WxrPost } from './types.ts';
import { metaValue } from './wxr.ts';

// Maps one published WordPress portfolio item to an item content file, plus
// the list of image files to copy for it.

export interface MappedItem {
  item: Item;
  copies: MediaCopy[];
  /** Decisions and oddities worth listing in the migration report. */
  notes: string[];
}

type Template = LegacyItemPage['layout'];

const TEMPLATE_LAYOUT = {
  'small-masonry': 'masonry',
  'small-images': 'stacked',
  gallery: 'gallery',
} as const;
const COLUMN_WORDS: Record<string, number> = { two: 2, three: 3, four: 4 };

// Theme defaults when an item doesn't set its own value.
const DEFAULT_TEMPLATE: Template = 'small-images';
const DEFAULT_COLUMNS = 3;

export function mapItem(post: WxrPost, wxr: WxrExport, legacy?: LegacyItemPage): MappedItem {
  const notes: string[] = [];
  const text = extractItemText(post.content, post.title);
  if (text.title !== post.title.trim()) {
    notes.push(
      `Title taken from the page heading "${text.title}" (WordPress title: "${post.title}").`,
    );
  }
  for (const leftover of text.leftovers)
    notes.push(`Unexpected markup left in the description: ${leftover}`);

  const layout = mapLayout(post, legacy, notes);
  const files = new MediaFiles(post.slug, wxr);

  // ---- Images, in gallery order ----
  const galleryIds = metaValue(post, 'edge-portfolio-image-gallery')
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean);

  const images: ImageMedia[] = [];
  for (const id of galleryIds) {
    const attachment = files.add(id);
    if (!attachment) {
      notes.push(`Gallery image ${id} is not in the export and was skipped.`);
      continue;
    }
    const large =
      metaValue(attachment.post, 'portfolio_single_masonry_image_size') ===
      'edge-large-masonry-item';
    images.push({
      type: 'image',
      file: attachment.path,
      alt: `${text.title} – view ${images.length + 1}`,
      size: large ? 'large' : 'normal',
    });
  }
  if (legacy) checkImagesAgainstPage(images, galleryIds, wxr, legacy, layout, notes);

  // ---- YouTube videos (shown after the images on the old site) ----
  const videos = mapVideos(post, text.title, notes);
  if (legacy && legacy.youtubeIds.join() !== videos.map((video) => video.id).join()) {
    notes.push(
      `Videos differ from the old page (export: ${videos.map((v) => v.id).join(', ') || 'none'}; page: ${legacy.youtubeIds.join(', ') || 'none'}).`,
    );
  }

  // ---- Cover (front-page thumbnail) ----
  const cover = files.add(metaValue(post, '_thumbnail_id'));
  if (!cover)
    notes.push('No featured image in the export; the first gallery image is used as the cover.');

  return {
    item: {
      title: text.title,
      slug: post.slug,
      subtitle: text.subtitle,
      date: post.date,
      draft: false,
      featured: false,
      categories: termSlugs(post, 'portfolio-category'),
      tags: termSlugs(post, 'portfolio-tag'),
      description: text.description,
      software: text.software,
      client: text.client,
      cover: cover?.path ?? images[0]?.file ?? '',
      layout,
      media: [...images, ...videos],
    },
    copies: files.copies,
    notes,
  };
}

function mapLayout(post: WxrPost, legacy: LegacyItemPage | undefined, notes: string[]): Layout {
  let template = (metaValue(post, 'edge_portfolio_single_template_meta') ||
    DEFAULT_TEMPLATE) as Template;
  if (!(template in TEMPLATE_LAYOUT)) {
    notes.push(`Unknown layout "${template}", using the theme default.`);
    template = DEFAULT_TEMPLATE;
  }
  if (legacy && legacy.layout !== template) {
    notes.push(
      `Layout "${template}" in the export, but the old page shows "${legacy.layout}". Using the page.`,
    );
    template = legacy.layout;
  }

  const type = TEMPLATE_LAYOUT[template];
  if (type === 'stacked') return { type };

  const columnsKey =
    type === 'masonry'
      ? 'edge_portfolio_single_masonry_columns_number_meta'
      : 'edge_portfolio_single_gallery_columns_number_meta';
  let columns = COLUMN_WORDS[metaValue(post, columnsKey)] ?? DEFAULT_COLUMNS;
  if (legacy?.columns && legacy.columns !== columns) {
    notes.push(
      `${columns} columns in the export, but the old page shows ${legacy.columns}. Using the page.`,
    );
    columns = legacy.columns;
  }
  return { type, columns };
}

/** Compares the mapped images with what the old page showed, and takes the page's large/normal sizes. */
function checkImagesAgainstPage(
  images: ImageMedia[],
  galleryIds: string[],
  wxr: WxrExport,
  legacy: LegacyItemPage,
  layout: Layout,
  notes: string[],
) {
  const exportNames = galleryIds.map((id) => {
    const attachment = wxr.byId.get(id);
    return attachment ? baseName(metaValue(attachment, '_wp_attached_file')) : `(missing ${id})`;
  });
  const pageNames = legacy.images.map((image) => image.file);
  if (exportNames.join() !== pageNames.join()) {
    notes.push(
      `Image order differs from the old page (export: ${exportNames.join(', ')}; page: ${pageNames.join(', ')}).`,
    );
    return;
  }
  // Only masonry pages mark large images.
  if (layout.type !== 'masonry') return;
  images.forEach((image, i) => {
    const pageSize = legacy.images[i].large ? 'large' : 'normal';
    if (image.size !== pageSize) {
      notes.push(
        `${pageNames[i]}: "${image.size}" in the export, "${pageSize}" on the old page. Using the page.`,
      );
      image.size = pageSize;
    }
  });
}

function mapVideos(post: WxrPost, title: string, notes: string[]): YoutubeMedia[] {
  const raw = metaValue(post, 'edge_portfolio_images');
  if (!raw) return [];

  const entries = Object.values(asRecord(phpUnserialize(raw)));
  const ids: string[] = [];
  for (const entry of entries.map(asRecord)) {
    if (
      entry.portfolioimgtype === 'video' &&
      entry.portfoliovideotype === 'youtube' &&
      entry.portfoliovideoid
    ) {
      ids.push(String(entry.portfoliovideoid));
    } else if (entry.portfolioimg || entry.portfoliovideoid) {
      notes.push(`Unsupported custom media entry skipped: ${JSON.stringify(entry)}`);
    } else {
      notes.push('Empty custom media entry skipped.');
    }
  }
  return ids.map((id, i) => ({
    type: 'youtube',
    id,
    title: ids.length > 1 ? `${title} – video ${i + 1}` : `${title} – video`,
    size: 'normal',
  }));
}

function termSlugs(post: WxrPost, taxonomy: string): string[] {
  return post.terms.filter((term) => term.taxonomy === taxonomy).map((term) => term.slug);
}

function asRecord(value: PhpValue): Record<string, PhpValue> {
  return value && typeof value === 'object' ? value : {};
}

function baseName(path: string): string {
  return path.split('/').pop() ?? path;
}

/**
 * Clean, lowercase file name for an uploaded file:
 * "3D7A6421-scaled.jpg" -> "3d7a6421.jpg". WordPress adds "-scaled" when it
 * shrinks a very large upload, which is the copy the old site displayed.
 */
export function mediaFileName(path: string): string {
  const base = baseName(path);
  const dot = base.lastIndexOf('.');
  const stem = dot > 0 ? base.slice(0, dot) : base;
  const ext =
    dot > 0
      ? base
          .slice(dot + 1)
          .toLowerCase()
          .replace('jpeg', 'jpg')
      : '';
  const clean = stem
    .replace(/-scaled$/i, '')
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^[-._]+|[-._]+$/g, '');
  return ext ? `${clean || 'image'}.${ext}` : clean;
}

/** Tracks the files one item uses, giving each a unique name in media/<slug>/. */
class MediaFiles {
  readonly copies: MediaCopy[] = [];
  private readonly slug: string;
  private readonly wxr: WxrExport;
  private readonly byId = new Map<string, string>();
  private readonly usedNames = new Set<string>();

  constructor(slug: string, wxr: WxrExport) {
    this.slug = slug;
    this.wxr = wxr;
  }

  /** Registers an attachment and returns its content path, or undefined if it isn't in the export. */
  add(id: string): { post: WxrPost; path: string } | undefined {
    const post = this.wxr.byId.get(id);
    const uploadPath =
      post && post.type === 'attachment' ? metaValue(post, '_wp_attached_file') : '';
    if (!post || !uploadPath) return undefined;

    let path = this.byId.get(id);
    if (!path) {
      const name = this.uniqueName(mediaFileName(uploadPath));
      path = `media/${this.slug}/${name}`;
      this.byId.set(id, path);
      this.copies.push({ from: uploadPath, to: path });
    }
    return { post, path };
  }

  private uniqueName(name: string): string {
    const dot = name.lastIndexOf('.');
    let candidate = name;
    for (let n = 2; this.usedNames.has(candidate); n++) {
      candidate = `${name.slice(0, dot)}-${n}${name.slice(dot)}`;
    }
    this.usedNames.add(candidate);
    return candidate;
  }
}
