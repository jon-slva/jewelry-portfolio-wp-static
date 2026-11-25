import { describe, expect, it } from 'vitest';
import { filterItems, getGridItems } from './portfolio.ts';
import type { Grid, Item } from './schema.ts';

const item = (slug: string, fields: Partial<Item> = {}): Item => ({
  title: slug,
  slug,
  subtitle: '',
  date: '2023-01-01',
  draft: false,
  featured: false,
  categories: [],
  tags: [],
  description: '',
  software: [],
  client: '',
  cover: `media/${slug}/cover.jpg`,
  layout: { type: 'stacked' },
  media: [],
  ...fields,
});

const grid = (items: string[]): Grid => ({
  items,
  columns: { wide: 5, desktop: 3, tablet: 2, phone: 1 },
  gap: 10,
});

describe('getGridItems', () => {
  it('returns items in grid.json order', () => {
    const items = [item('a'), item('b'), item('c')];
    expect(getGridItems(items, grid(['c', 'a', 'b'])).map((i) => i.slug)).toEqual(['c', 'a', 'b']);
  });

  it('leaves out drafts and items the grid does not list', () => {
    const items = [item('a'), item('b', { draft: true }), item('c')];
    expect(getGridItems(items, grid(['a', 'b', 'missing'])).map((i) => i.slug)).toEqual(['a']);
  });
});

describe('filterItems', () => {
  const items = [
    item('ring', { categories: ['fine'], tags: ['gold'] }),
    item('skull', { categories: ['sculpture'], tags: ['gold'] }),
    item('pendant', { categories: ['fine'], tags: [] }),
  ];
  const slugs = (filtered: Item[]) => filtered.map((i) => i.slug);

  it('returns everything with no filter', () => {
    expect(slugs(filterItems(items, {}))).toEqual(['ring', 'skull', 'pendant']);
  });

  it('filters by category, tag, or both', () => {
    expect(slugs(filterItems(items, { category: 'fine' }))).toEqual(['ring', 'pendant']);
    expect(slugs(filterItems(items, { tag: 'gold' }))).toEqual(['ring', 'skull']);
    expect(slugs(filterItems(items, { category: 'fine', tag: 'gold' }))).toEqual(['ring']);
  });
});
