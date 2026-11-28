import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

// Pages generated from the content, for pre-rendering. Read straight from the
// item files because this runs inside react-router.config.ts, before Vite.

/** Pages that always exist, whatever the content. */
export const FIXED_PAGES = ['/', '/resume/', '/contact-me/'];

interface ItemSummary {
  slug: string;
  draft: boolean;
  categories: string[];
  tags: string[];
}

/**
 * Every content page URL: one per published item, plus one per category and
 * tag that a published item uses. Drafts are left out.
 */
export function contentPaths(items: ItemSummary[]): string[] {
  const published = items.filter((item) => !item.draft);
  const unique = (slugs: string[]) => [...new Set(slugs)].sort();
  return [
    ...published.map((item) => `/portfolio-item/${item.slug}/`),
    ...unique(published.flatMap((item) => item.categories)).map(
      (slug) => `/portfolio-category/${slug}/`,
    ),
    ...unique(published.flatMap((item) => item.tags)).map((slug) => `/portfolio-tag/${slug}/`),
  ];
}

/** The item files in src/content/items/, with just the fields pre-rendering needs. */
export function readItemSummaries(contentDir: string): ItemSummary[] {
  const itemsDir = path.join(contentDir, 'items');
  return readdirSync(itemsDir)
    .filter((name) => name.endsWith('.json'))
    .map((name) => JSON.parse(readFileSync(path.join(itemsDir, name), 'utf8')) as ItemSummary);
}
