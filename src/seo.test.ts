import { describe, expect, it } from 'vitest';
import type { ImageInfo } from './content/media.ts';
import { absoluteUrl, itemDescription, pageMeta, truncate } from './seo.ts';

const settings = { siteUrl: 'https://example.com/base/', indexable: true };
const image: ImageInfo = {
  width: 2400,
  height: 1800,
  color: '#000000',
  animated: false,
  webp: [],
  fallback: 'img/ring/cover.jpg',
  hash: 'x',
};

const find = (tags: ReturnType<typeof pageMeta>, key: string) =>
  tags.find((tag) => 'property' in tag && tag.property === key) as { content: string } | undefined;

describe('pageMeta', () => {
  it('builds title, description, canonical and Open Graph tags with absolute URLs', () => {
    const tags = pageMeta(
      { title: 'Ring', description: 'A ring.', path: '/portfolio-item/ring/', image },
      settings,
    );
    expect(tags).toContainEqual({ title: 'Ring – Jewelry by Jonathan Silva' });
    expect(tags).toContainEqual({
      tagName: 'link',
      rel: 'canonical',
      href: 'https://example.com/base/portfolio-item/ring/',
    });
    expect(find(tags, 'og:image')?.content).toBe('https://example.com/base/img/ring/cover.jpg');
    // The 1200px JPEG keeps the original's shape.
    expect(find(tags, 'og:image:width')?.content).toBe('1200');
    expect(find(tags, 'og:image:height')?.content).toBe('900');
  });

  it('marks preview builds noindex', () => {
    const tags = pageMeta({ description: 'Home', path: '/' }, { ...settings, indexable: false });
    expect(tags).toContainEqual({ name: 'robots', content: 'noindex, nofollow' });
    expect(pageMeta({ description: 'Home', path: '/' }, settings)).not.toContainEqual(
      expect.objectContaining({ name: 'robots' }),
    );
  });
});

describe('absoluteUrl', () => {
  it('joins the site address and a path without doubling slashes', () => {
    expect(absoluteUrl('/resume/', 'https://example.com/')).toBe('https://example.com/resume/');
    expect(absoluteUrl('img/a.jpg', 'https://example.com/')).toBe('https://example.com/img/a.jpg');
  });
});

describe('truncate', () => {
  it('leaves short text alone and cuts long text at a word', () => {
    expect(truncate('Short text.')).toBe('Short text.');
    const long = 'word '.repeat(60);
    const cut = truncate(long, 30);
    expect(cut.length).toBeLessThanOrEqual(30);
    expect(cut.endsWith('word…')).toBe(true);
  });
});

describe('itemDescription', () => {
  const base = { title: 'Ruby Ring', software: ['Rhino', 'Matrix'], categoryNames: ['Fine'] };

  it('uses the first paragraph of the item’s own description', () => {
    expect(itemDescription({ ...base, description: 'First.\n\nSecond.', client: '' })).toBe(
      'First.',
    );
  });

  it('builds one from the details when there is no description', () => {
    expect(itemDescription({ ...base, description: '', client: 'Reza' })).toBe(
      'Ruby Ring: Fine piece designed by Jonathan Silva for Reza. Made with Rhino, Matrix.',
    );
  });
});
