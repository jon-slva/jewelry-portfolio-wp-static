import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

/**
 * URL of every published portfolio item, for pre-rendering:
 * "/portfolio-item/<slug>/". Drafts are left out.
 */
export function itemPaths(contentDir: string): string[] {
  const itemsDir = path.join(contentDir, 'items');
  return readdirSync(itemsDir)
    .filter((name) => name.endsWith('.json'))
    .map(
      (name) =>
        JSON.parse(readFileSync(path.join(itemsDir, name), 'utf8')) as {
          slug: string;
          draft: boolean;
        },
    )
    .filter((item) => !item.draft)
    .map((item) => `/portfolio-item/${item.slug}/`);
}
