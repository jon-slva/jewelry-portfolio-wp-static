import type { MetaDescriptor } from 'react-router';
import { FALLBACK_WIDTH, type ImageInfo } from './content/media.ts';
import site from './content/site.json';

// The <head> tags every page needs for search engines and link previews.
// Route `meta` functions call pageMeta() instead of listing tags by hand.

export interface PageMetaInput {
  /** Page title without the site name, e.g. "Wall-E Necklace". Omit for the home page. */
  title?: string;
  /** One or two sentences for search results and link previews. */
  description: string;
  /** The page's path, e.g. "/portfolio-item/wall-e-necklace/". */
  path: string;
  /** Image shown in link previews (LinkedIn, Slack, iMessage…). */
  image?: ImageInfo;
  /** "article" for a single piece, "website" for everything else. */
  type?: 'website' | 'article';
}

export interface SiteSettings {
  /** Site home page address, ending in "/". */
  siteUrl: string;
  indexable: boolean;
}

/** The values Vite writes in at build time (see config/site.ts). */
const buildSettings: SiteSettings = { siteUrl: __SITE_URL__, indexable: __SITE_INDEXABLE__ };

/** Absolute address of a site path or public file: "/resume/" -> "https://…/resume/". */
export function absoluteUrl(path: string, siteUrl = buildSettings.siteUrl): string {
  return siteUrl + path.replace(/^\//, '');
}

export function pageMeta(input: PageMetaInput, settings = buildSettings): MetaDescriptor[] {
  const title = input.title ? `${input.title} – ${site.title}` : `${site.title} – ${site.tagline}`;
  const url = absoluteUrl(input.path, settings.siteUrl);

  const tags: MetaDescriptor[] = [
    { title },
    { name: 'description', content: input.description },
    // The one official address of this page, so search engines don't count
    // copies (with or without a trailing slash, preview builds…) separately.
    { tagName: 'link', rel: 'canonical', href: url },
    // Open Graph: what LinkedIn, Facebook, Slack, iMessage… show for a shared link.
    { property: 'og:site_name', content: site.title },
    { property: 'og:type', content: input.type ?? 'website' },
    { property: 'og:title', content: input.title ?? site.title },
    { property: 'og:description', content: input.description },
    { property: 'og:url', content: url },
    { name: 'twitter:card', content: input.image ? 'summary_large_image' : 'summary' },
  ];

  if (input.image) {
    // The JPEG copy: every link-preview service can read it (not all read WebP).
    const width = Math.min(FALLBACK_WIDTH, input.image.width);
    const height = Math.round((input.image.height * width) / input.image.width);
    tags.push(
      { property: 'og:image', content: absoluteUrl(input.image.fallback, settings.siteUrl) },
      { property: 'og:image:width', content: String(width) },
      { property: 'og:image:height', content: String(height) },
    );
  }

  if (!settings.indexable) tags.push({ name: 'robots', content: 'noindex, nofollow' });
  return tags;
}

/** Shortens text to at most `max` characters, ending at a word, with "…". */
export function truncate(text: string, max = 155): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  return `${cut.slice(0, cut.lastIndexOf(' ')).replace(/[\s,.;:–-]+$/, '')}…`;
}

/** A description for an item page: its own text if it has some, otherwise built from its details. */
export function itemDescription(item: {
  title: string;
  description: string;
  software: string[];
  client: string;
  categoryNames: string[];
}): string {
  if (item.description) return truncate(item.description.split('\n\n')[0]);
  const kind = item.categoryNames.length ? `${item.categoryNames.join(' / ')} piece` : 'piece';
  const parts = [`${item.title}: ${kind} designed by Jonathan Silva`];
  if (item.client) parts.push(`for ${item.client}`);
  const sentence = `${parts.join(' ')}.`;
  return truncate(
    item.software.length ? `${sentence} Made with ${item.software.join(', ')}.` : sentence,
  );
}
