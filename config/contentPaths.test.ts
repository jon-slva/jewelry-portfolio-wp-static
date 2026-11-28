import { describe, expect, it } from 'vitest';
import { contentPaths } from './contentPaths.ts';

describe('contentPaths', () => {
  it('lists published items and the categories and tags they use', () => {
    const items = [
      { slug: 'ring', draft: false, categories: ['fine'], tags: ['gold'] },
      { slug: 'skull', draft: false, categories: ['sculpture', 'fine'], tags: [] },
      { slug: 'secret', draft: true, categories: ['art'], tags: ['hidden'] },
    ];
    expect(contentPaths(items)).toEqual([
      '/portfolio-item/ring/',
      '/portfolio-item/skull/',
      '/portfolio-category/fine/',
      '/portfolio-category/sculpture/',
      '/portfolio-tag/gold/',
    ]);
  });
});
