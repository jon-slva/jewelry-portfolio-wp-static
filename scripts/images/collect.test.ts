import { describe, expect, it } from 'vitest';
import type { ContentSnapshot } from '../lib/content-files.ts';
import { collectMediaPaths } from './collect.ts';

describe('collectMediaPaths', () => {
  it('lists covers, gallery images, video posters and videos that exist', () => {
    const content: ContentSnapshot = {
      site: { path: 'site.json', error: 'file is missing' },
      grid: { path: 'grid.json', data: {} },
      categories: { path: 'categories.json', data: [] },
      tags: { path: 'tags.json', data: [] },
      redirects: { path: 'redirects.json', data: [] },
      items: [
        {
          path: 'items/ring.json',
          data: {
            title: 'Ring',
            slug: 'ring',
            subtitle: '',
            date: '2023-07-21',
            draft: false,
            featured: false,
            categories: [],
            tags: [],
            description: '',
            software: [],
            client: '',
            cover: 'media/ring/cover.jpg',
            coverVideo: 'media/ring/tile.mp4',
            layout: { type: 'stacked' },
            media: [
              { type: 'image', file: 'media/ring/a.jpg', alt: '', size: 'normal' },
              { type: 'image', file: 'media/ring/gone.jpg', alt: '', size: 'normal' },
              {
                type: 'video',
                file: 'media/ring/turn.mp4',
                poster: 'media/ring/turn-poster.jpg',
                alt: '',
                size: 'normal',
              },
            ],
          },
        },
        { path: 'items/broken.json', data: { title: 'No slug' } },
      ],
      mediaFiles: new Set([
        'media/ring/cover.jpg',
        'media/ring/tile.mp4',
        'media/ring/a.jpg',
        'media/ring/turn.mp4',
        'media/ring/turn-poster.jpg',
      ]),
    };

    expect(collectMediaPaths(content)).toEqual({
      images: ['media/ring/a.jpg', 'media/ring/cover.jpg', 'media/ring/turn-poster.jpg'],
      videos: ['media/ring/tile.mp4', 'media/ring/turn.mp4'],
    });
  });
});
