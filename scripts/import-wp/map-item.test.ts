import { describe, expect, it } from 'vitest';
import { makeAttachment, makeExport, makePost } from './fixtures.ts';
import { mapItem, mediaFileName } from './map-item.ts';
import type { LegacyItemPage } from './types.ts';

const video = (id: string) =>
  `a:4:{s:12:"portfolioimg";s:0:"";s:18:"portfoliovideotype";s:7:"youtube";s:16:"portfoliovideoid";s:11:"${id}";s:16:"portfolioimgtype";s:5:"video";}`;

function setup(meta: Record<string, string>, legacy?: LegacyItemPage) {
  const post = makePost({
    content: '<h2>Test Ring</h2>\n<strong>Software</strong>: Rhino',
    terms: [
      { taxonomy: 'portfolio-category', slug: 'fine', name: 'Fine' },
      { taxonomy: 'portfolio-tag', slug: 'gold', name: 'Gold' },
    ],
    meta: { 'edge-portfolio-image-gallery': '10,11', _thumbnail_id: '12', ...meta },
  });
  const wxr = makeExport([
    post,
    makeAttachment('10', 'Hero-Shot-scaled.jpg', 'large'),
    makeAttachment('11', 'side.PNG', 'normal'),
    makeAttachment('12', 'thumb.jpg'),
  ]);
  return mapItem(post, wxr, legacy);
}

describe('mapItem', () => {
  it('maps text, terms, images and cover', () => {
    const { item, copies } = setup({ edge_portfolio_single_template_meta: 'small-masonry' });

    expect(item).toMatchObject({
      title: 'Test Ring',
      slug: 'test-ring',
      categories: ['fine'],
      tags: ['gold'],
      software: ['Rhino'],
      cover: 'media/test-ring/thumb.jpg',
      draft: false,
      featured: false,
    });
    expect(item.media).toEqual([
      {
        type: 'image',
        file: 'media/test-ring/hero-shot.jpg',
        alt: 'Test Ring – view 1',
        size: 'large',
      },
      {
        type: 'image',
        file: 'media/test-ring/side.png',
        alt: 'Test Ring – view 2',
        size: 'normal',
      },
    ]);
    expect(copies).toEqual([
      { from: 'Hero-Shot-scaled.jpg', to: 'media/test-ring/hero-shot.jpg' },
      { from: 'side.PNG', to: 'media/test-ring/side.png' },
      { from: 'thumb.jpg', to: 'media/test-ring/thumb.jpg' },
    ]);
  });

  it('maps each theme layout, with the theme defaults', () => {
    const layout = (meta: Record<string, string>) => setup(meta).item.layout;
    expect(layout({ edge_portfolio_single_template_meta: 'small-masonry' })).toEqual({
      type: 'masonry',
      columns: 3,
    });
    expect(
      layout({
        edge_portfolio_single_template_meta: 'small-masonry',
        edge_portfolio_single_masonry_columns_number_meta: 'two',
      }),
    ).toEqual({ type: 'masonry', columns: 2 });
    expect(layout({ edge_portfolio_single_template_meta: 'gallery' })).toEqual({
      type: 'gallery',
      columns: 3,
    });
    expect(layout({ edge_portfolio_single_template_meta: 'small-images' })).toEqual({
      type: 'stacked',
    });
    expect(layout({})).toEqual({ type: 'stacked' });
  });

  it('adds YouTube videos after the images', () => {
    const { item } = setup({
      edge_portfolio_images: `a:2:{i:0;${video('r0O95MqK2jQ')}i:1;${video('n_LsoHPn--8')}}`,
    });
    expect(item.media.slice(2)).toEqual([
      { type: 'youtube', id: 'r0O95MqK2jQ', title: 'Test Ring – video 1', size: 'normal' },
      { type: 'youtube', id: 'n_LsoHPn--8', title: 'Test Ring – video 2', size: 'normal' },
    ]);
  });

  it('follows the old page when it disagrees with the export, and says so', () => {
    const { item, notes } = setup(
      { edge_portfolio_single_template_meta: 'small-masonry' },
      {
        layout: 'small-masonry',
        columns: 2,
        images: [
          { file: 'Hero-Shot-scaled.jpg', large: false },
          { file: 'side.PNG', large: true },
        ],
        youtubeIds: [],
      },
    );
    expect(item.layout).toEqual({ type: 'masonry', columns: 2 });
    expect(item.media.map((media) => media.size)).toEqual(['normal', 'large']);
    expect(notes).toHaveLength(3);
  });

  it('notes a missing gallery image and falls back to the first image as cover', () => {
    const { item, notes } = setup({ 'edge-portfolio-image-gallery': '10,99', _thumbnail_id: '' });
    expect(item.media).toHaveLength(1);
    expect(item.cover).toBe('media/test-ring/hero-shot.jpg');
    expect(notes.join(' ')).toMatch(/99 is not in the export/);
  });
});

describe('mediaFileName', () => {
  it('lowercases, drops -scaled and replaces unsafe characters', () => {
    expect(mediaFileName('2023/07/3D7A6421-scaled.JPEG')).toBe('3d7a6421.jpg');
    expect(mediaFileName('Merge View (1).png')).toBe('merge-view-1.png');
    expect(mediaFileName('Wall-E_Render--2.jpg')).toBe('wall-e_render-2.jpg');
  });
});
