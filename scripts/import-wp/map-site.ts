import type { Grid, Item, Redirect, Term } from '../../src/content/schema.ts';
import type { WxrPost } from './types.ts';

// Site-wide pieces of the import: spelling clean-up across items, the
// category and tag lists, the front-page grid and old-URL redirects.

/**
 * Picks one spelling for values that differ only in letter case
 * ("zBrush" / "Zbrush"): the most common one, or the first seen on a tie.
 * Returns a map from every spelling to the chosen one.
 */
export function chooseSpellings(values: string[]): Map<string, string> {
  const counts = new Map<string, Map<string, number>>();
  for (const value of values) {
    const key = value.toLowerCase();
    const spellings = counts.get(key) ?? new Map<string, number>();
    spellings.set(value, (spellings.get(value) ?? 0) + 1);
    counts.set(key, spellings);
  }

  const chosen = new Map<string, string>();
  for (const spellings of counts.values()) {
    let best = '';
    let bestCount = 0;
    for (const [spelling, count] of spellings) {
      if (count > bestCount) [best, bestCount] = [spelling, count];
    }
    for (const spelling of spellings.keys()) chosen.set(spelling, best);
  }
  return chosen;
}

/**
 * Applies one spelling per software name and client across all items.
 * Returns a note for every change made.
 */
export function normalizeSpellings(items: Item[]): string[] {
  const software = chooseSpellings(items.flatMap((item) => item.software));
  const clients = chooseSpellings(items.map((item) => item.client).filter(Boolean));
  const notes: string[] = [];

  for (const item of items) {
    item.software = item.software.map((name) => {
      const fixed = software.get(name) ?? name;
      if (fixed !== name) notes.push(`${item.slug}: software "${name}" → "${fixed}"`);
      return fixed;
    });
    const client = clients.get(item.client) ?? item.client;
    if (client !== item.client) notes.push(`${item.slug}: client "${item.client}" → "${client}"`);
    item.client = client;
  }
  return notes;
}

/**
 * Terms used by the imported items. Categories follow the old filter bar
 * order (any others go after it, by name); tags are sorted by name.
 */
export function collectTerms(
  posts: WxrPost[],
  taxonomy: 'portfolio-category' | 'portfolio-tag',
  order: string[] = [],
): Term[] {
  const terms = new Map<string, Term>();
  for (const term of posts.flatMap((post) => post.terms)) {
    if (term.taxonomy === taxonomy) terms.set(term.slug, { slug: term.slug, name: term.name });
  }
  const rank = (term: Term) => {
    const index = order.indexOf(term.slug);
    return index === -1 ? order.length : index;
  };
  return [...terms.values()].sort((a, b) => rank(a) - rank(b) || a.name.localeCompare(b.name));
}

export const DEFAULT_GRID_SETTINGS: Omit<Grid, 'items'> = {
  // Matches the Anders theme: 5 / 3 / 2 / 1 tiles per row, 10px apart.
  columns: { wide: 5, desktop: 3, tablet: 2, phone: 1 },
  gap: 10,
};

/**
 * Front-page order from the old home page. Items the page didn't show are
 * added at the end, newest first.
 */
export function buildGrid(items: Item[], pageOrder: string[]): { grid: Grid; notes: string[] } {
  const slugs = new Set(items.map((item) => item.slug));
  const ordered = pageOrder.filter((slug) => slugs.has(slug));
  const missing = items
    .filter((item) => !ordered.includes(item.slug))
    .sort((a, b) => b.date.localeCompare(a.date))
    .map((item) => item.slug);

  const notes = [
    ...pageOrder
      .filter((slug) => !slugs.has(slug))
      .map((slug) => `The old home page lists "${slug}", which wasn't imported.`),
    ...missing.map(
      (slug) => `"${slug}" wasn't on the old home page; added at the end of the grid.`,
    ),
  ];
  return { grid: { items: [...ordered, ...missing], ...DEFAULT_GRID_SETTINGS }, notes };
}

/**
 * Old slugs from WordPress (_wp_old_slug) that should forward to the current
 * item. Most old slugs are leftovers from duplicating posts, so these are
 * skipped:
 * - slugs that are now another item's slug
 * - slugs claimed by more than one item (copies carry their source's old slugs)
 * - "<item>-2" style slugs WordPress gives a fresh copy, and one-letter slugs
 */
export function collectRedirects(posts: WxrPost[]): { redirects: Redirect[]; skipped: string[] } {
  const current = new Set(posts.map((post) => post.slug));
  const claims = new Map<string, Set<string>>();
  for (const post of posts) {
    for (const old of post.meta.get('_wp_old_slug') ?? []) {
      if (old === post.slug) continue;
      claims.set(old, (claims.get(old) ?? new Set()).add(post.slug));
    }
  }

  const redirects: Redirect[] = [];
  const skipped: string[] = [];
  for (const [from, owners] of [...claims].sort(([a], [b]) => a.localeCompare(b))) {
    if (current.has(from)) {
      skipped.push(`${from} (now its own item)`);
    } else if (owners.size > 1) {
      skipped.push(`${from} (claimed by ${[...owners].join(', ')})`);
    } else if (current.has(from.replace(/-\d+$/, '')) || from.length < 3) {
      skipped.push(`${from} (left over from copying a post)`);
    } else if (/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(from)) {
      redirects.push({ from, to: [...owners][0] });
    } else {
      skipped.push(`${from} (not a valid slug)`);
    }
  }
  return { redirects, skipped };
}
