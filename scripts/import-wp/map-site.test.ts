import { describe, expect, it } from 'vitest';
import type { Item } from '../../src/content/schema.ts';
import { makePost } from './fixtures.ts';
import {
  buildGrid,
  chooseSpellings,
  collectRedirects,
  collectTerms,
  normalizeSpellings,
} from './map-site.ts';

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

describe('spellings', () => {
  it('picks the most common spelling of each value', () => {
    const chosen = chooseSpellings(['Zbrush', 'zBrush', 'Zbrush', 'Matrix']);
    expect(chosen.get('zBrush')).toBe('Zbrush');
    expect(chosen.get('Matrix')).toBe('Matrix');
  });

  it('applies them to software and clients, with a note per change', () => {
    const items = [
      item('a', { software: ['Zbrush'], client: 'Private client' }),
      item('b', { software: ['Zbrush'], client: 'Private client' }),
      item('c', { software: ['zBrush'], client: 'Private Client' }),
    ];
    const notes = normalizeSpellings(items);
    expect(items[2]).toMatchObject({ software: ['Zbrush'], client: 'Private client' });
    expect(notes).toHaveLength(2);
  });
});

describe('collectTerms', () => {
  const posts = [
    makePost({
      terms: [
        { taxonomy: 'portfolio-category', slug: 'sculpture', name: 'Sculpture' },
        { taxonomy: 'portfolio-category', slug: 'art', name: 'Art' },
        { taxonomy: 'portfolio-tag', slug: 'zeta', name: 'Zeta' },
        { taxonomy: 'portfolio-tag', slug: 'alpha', name: 'Alpha' },
      ],
    }),
  ];

  it('orders categories like the old filter bar, unknown ones last', () => {
    expect(collectTerms(posts, 'portfolio-category', ['sculpture']).map((t) => t.slug)).toEqual([
      'sculpture',
      'art',
    ]);
  });

  it('sorts tags by name', () => {
    expect(collectTerms(posts, 'portfolio-tag').map((t) => t.slug)).toEqual(['alpha', 'zeta']);
  });
});

describe('buildGrid', () => {
  it('follows the home page order and appends missing items, newest first', () => {
    const items = [
      item('a'),
      item('b', { date: '2020-01-01' }),
      item('c', { date: '2024-01-01' }),
      item('d'),
    ];
    const { grid, notes } = buildGrid(items, ['d', 'gone', 'a']);
    expect(grid.items).toEqual(['d', 'a', 'c', 'b']);
    expect(notes).toHaveLength(3);
  });
});

describe('collectRedirects', () => {
  it('keeps real renames and skips copy leftovers', () => {
    const posts = [
      makePost({
        slug: 'new-name',
        meta: { _wp_old_slug: ['old-name', 'shared', 'other-item', 'new-name-2'] },
      }),
      makePost({ slug: 'other-item', meta: { _wp_old_slug: ['shared', 'c'] } }),
    ];
    const { redirects, skipped } = collectRedirects(posts);
    expect(redirects).toEqual([{ from: 'old-name', to: 'new-name' }]);
    expect(skipped).toHaveLength(4);
  });
});
