import type { Grid, Item } from './schema.ts';

// Front-page grid and filter logic, kept free of React so it can be unit tested.

export interface ItemFilter {
  category?: string;
  tag?: string;
}

/**
 * Published items in the order set by grid.json.
 * Drafts are left out, and so is anything grid.json doesn't list
 * (`npm run validate` reports those).
 */
export function getGridItems(items: Item[], grid: Grid): Item[] {
  const bySlug = new Map(items.map((item) => [item.slug, item]));
  return grid.items
    .map((slug) => bySlug.get(slug))
    .filter((item): item is Item => item !== undefined && !item.draft);
}

/** Items matching every filter that is set. No filters returns all items. */
export function filterItems(items: Item[], { category, tag }: ItemFilter): Item[] {
  return items.filter(
    (item) =>
      (!category || item.categories.includes(category)) && (!tag || item.tags.includes(tag)),
  );
}
