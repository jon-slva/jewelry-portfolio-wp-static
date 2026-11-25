import { describe, expect, it } from 'vitest';
import type { Item } from '../../src/content/schema.ts';
import type { ContentSnapshot } from '../lib/content-files.ts';
import { validateContent } from './rules.ts';

// Each rule gets a valid baseline, then one change that should break it.

const ring: Item = {
  title: 'Ring',
  slug: 'ring',
  subtitle: '',
  date: '2023-07-21',
  draft: false,
  featured: false,
  categories: ['fine'],
  tags: ['gold'],
  description: '',
  software: ['Rhino'],
  client: '',
  cover: 'media/ring/cover.jpg',
  layout: { type: 'masonry', columns: 3 },
  media: [
    { type: 'image', file: 'media/ring/front.jpg', alt: 'Ring – view 1', size: 'large' },
    {
      type: 'video',
      file: 'media/ring/turn.mp4',
      poster: 'media/ring/turn-poster.jpg',
      alt: 'Ring – turnaround',
      size: 'normal',
    },
    { type: 'youtube', id: 'r0O95MqK2jQ', title: 'Ring – video', size: 'normal' },
  ],
};

function snapshot(change: (content: ContentSnapshot) => void = () => {}): ContentSnapshot {
  const content: ContentSnapshot = {
    site: {
      path: 'site.json',
      data: {
        title: 'Site',
        tagline: '',
        logo: 'media/site/logo.png',
        copyright: '',
        social: [{ label: 'LinkedIn', url: 'https://www.linkedin.com/' }],
        resume: { pdf: 'media/site/resume.pdf', preview: 'media/site/resume.jpg' },
      },
    },
    grid: {
      path: 'grid.json',
      data: { items: ['ring'], columns: { wide: 5, desktop: 3, tablet: 2, phone: 1 }, gap: 10 },
    },
    categories: { path: 'categories.json', data: [{ slug: 'fine', name: 'Fine' }] },
    tags: { path: 'tags.json', data: [{ slug: 'gold', name: 'Gold' }] },
    redirects: { path: 'redirects.json', data: [{ from: 'old-ring', to: 'ring' }] },
    items: [{ path: 'items/ring.json', data: structuredClone(ring) }],
    mediaFiles: new Set([
      'media/site/logo.png',
      'media/site/resume.pdf',
      'media/site/resume.jpg',
      'media/ring/cover.jpg',
      'media/ring/front.jpg',
      'media/ring/turn.mp4',
      'media/ring/turn-poster.jpg',
    ]),
  };
  change(content);
  return content;
}

const itemData = (content: ContentSnapshot) => content.items[0].data as Item;
const errorsFor = (change: (content: ContentSnapshot) => void) =>
  validateContent(snapshot(change)).errors;

describe('validateContent', () => {
  it('passes valid content', () => {
    expect(validateContent(snapshot())).toEqual({ errors: [], warnings: [] });
  });

  it('reports missing files and invalid JSON', () => {
    expect(errorsFor((c) => (c.tags = { path: 'tags.json', error: 'file is missing' }))).toEqual([
      'tags.json: file is missing',
    ]);
  });

  it('reports schema problems with their location', () => {
    const errors = errorsFor((c) => {
      itemData(c).date = '21/07/2023';
      (itemData(c) as unknown as Record<string, unknown>).colour = 'gold';
    });
    expect(errors.some((e) => e.startsWith('items/ring.json → date'))).toBe(true);
    expect(errors.some((e) => e.includes('colour'))).toBe(true);
  });

  it('rejects upper-case media paths', () => {
    expect(errorsFor((c) => (itemData(c).cover = 'media/ring/Cover.JPG'))).toContain(
      'items/ring.json → cover: Use a lowercase path like media/<folder>/<file>.jpg',
    );
  });

  it('reports a slug that does not match its file name', () => {
    expect(errorsFor((c) => (c.items[0].path = 'items/other.json'))).toEqual([
      expect.stringContaining("doesn't match the file name"),
    ]);
  });

  it('reports duplicate slugs', () => {
    expect(
      errorsFor((c) => {
        c.items.push({ path: 'items/ring.json', data: structuredClone(ring) });
      }),
    ).toEqual([expect.stringContaining('duplicate slug "ring"')]);
    expect(
      errorsFor((c) => {
        c.tags.data = [
          { slug: 'gold', name: 'Gold' },
          { slug: 'gold', name: 'Gold again' },
        ];
      }),
    ).toEqual(['tags.json: duplicate slug "gold"']);
  });

  it('reports unknown categories and tags', () => {
    expect(
      errorsFor((c) => {
        itemData(c).categories = ['jewelry'];
        itemData(c).tags = ['silver'];
      }),
    ).toEqual([
      'items/ring.json: unknown category "jewelry" (not in categories.json)',
      'items/ring.json: unknown tag "silver" (not in tags.json)',
    ]);
  });

  it('reports broken image references', () => {
    expect(errorsFor((c) => c.mediaFiles.delete('media/ring/front.jpg'))).toEqual([
      'items/ring.json → media.0: file not found: src/content/media/ring/front.jpg',
    ]);
    expect(errorsFor((c) => c.mediaFiles.delete('media/site/logo.png'))).toHaveLength(1);
  });

  it('checks video files and their posters', () => {
    expect(errorsFor((c) => c.mediaFiles.delete('media/ring/turn-poster.jpg'))).toEqual([
      'items/ring.json → media.1.poster: file not found: src/content/media/ring/turn-poster.jpg',
    ]);
    expect(
      errorsFor((c) => {
        const video = itemData(c).media[1] as { file: string };
        video.file = 'media/ring/turn.gif';
      }),
    ).toEqual([expect.stringContaining('Use an .mp4 video')]);
  });

  it('checks the optional cover video', () => {
    expect(errorsFor((c) => (itemData(c).coverVideo = 'media/ring/missing.mp4'))).toEqual([
      'items/ring.json → coverVideo: file not found: src/content/media/ring/missing.mp4',
    ]);
  });

  it('reports items missing from the grid, and grid entries with no item', () => {
    expect(errorsFor((c) => ((c.grid.data as { items: string[] }).items = ['ghost']))).toEqual([
      'grid.json: "ghost" has no item file',
      'grid.json: item "ring" is missing from the grid',
    ]);
    expect(
      errorsFor((c) => ((c.grid.data as { items: string[] }).items = ['ring', 'ring'])),
    ).toEqual(['grid.json: "ring" is listed more than once']);
  });

  it('reports redirects that clash with an item or point nowhere', () => {
    expect(errorsFor((c) => (c.redirects.data = [{ from: 'ring', to: 'gone' }]))).toHaveLength(2);
  });

  it('warns about unused media files without failing', () => {
    const result = validateContent(snapshot((c) => c.mediaFiles.add('media/ring/spare.jpg')));
    expect(result.errors).toEqual([]);
    expect(result.warnings).toEqual(["src/content/media/ring/spare.jpg isn't used by any item"]);
  });
});
