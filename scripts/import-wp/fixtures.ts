import type { WxrExport, WxrPost } from './types.ts';

// Small hand-made WordPress records for the importer tests (no real export needed).

export function makePost(
  fields: Partial<Omit<WxrPost, 'meta'>> & { meta?: Record<string, string | string[]> },
): WxrPost {
  const meta = new Map(
    Object.entries(fields.meta ?? {}).map(([key, value]) => [
      key,
      Array.isArray(value) ? value : [value],
    ]),
  );
  return {
    id: '1',
    type: 'portfolio-item',
    status: 'publish',
    slug: 'test-ring',
    title: 'Test Ring',
    date: '2023-07-21',
    parentId: '0',
    content: '',
    terms: [],
    ...fields,
    meta,
  };
}

export function makeAttachment(id: string, file: string, size?: 'large' | 'normal'): WxrPost {
  return makePost({
    id,
    type: 'attachment',
    status: 'inherit',
    meta: {
      _wp_attached_file: file,
      ...(size && {
        portfolio_single_masonry_image_size:
          size === 'large' ? 'edge-large-masonry-item' : 'edge-default-masonry-item',
      }),
    },
  });
}

export function makeExport(posts: WxrPost[]): WxrExport {
  return { posts, byId: new Map(posts.map((post) => [post.id, post])) };
}
