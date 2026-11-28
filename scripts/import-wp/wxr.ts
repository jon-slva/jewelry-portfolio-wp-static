import { XMLParser } from 'fast-xml-parser';
import type { WxrExport, WxrPost, WxrTermRef } from './types.ts';

// Reads a WordPress export file (WXR, an RSS-based XML format) into plain objects.

// Elements that can repeat, so the parser always returns arrays for them.
const repeating = new Set(['item', 'wp:postmeta', 'category']);

export function parseWxr(xml: string): WxrExport {
  const parser = new XMLParser({
    ignoreAttributes: false,
    // Keep every value as a string ("0012" must not become 12).
    parseTagValue: false,
    parseAttributeValue: false,
    isArray: (name) => repeating.has(name),
  });
  const doc = parser.parse(xml);
  const rawItems: Record<string, unknown>[] = doc?.rss?.channel?.item ?? [];

  const posts = rawItems.map(toPost);
  return { posts, byId: new Map(posts.map((post) => [post.id, post])) };
}

function toPost(raw: Record<string, unknown>): WxrPost {
  const text = (key: string) => {
    const value = raw[key];
    return typeof value === 'string' ? value : '';
  };

  const meta = new Map<string, string[]>();
  for (const entry of (raw['wp:postmeta'] as Record<string, unknown>[] | undefined) ?? []) {
    const key = String(entry['wp:meta_key'] ?? '');
    const value = String(entry['wp:meta_value'] ?? '');
    meta.set(key, [...(meta.get(key) ?? []), value]);
  }

  const terms: WxrTermRef[] = ((raw.category as Record<string, string>[] | undefined) ?? []).map(
    (term) => ({
      taxonomy: term['@_domain'] ?? '',
      slug: term['@_nicename'] ?? '',
      name: term['#text'] ?? '',
    }),
  );

  return {
    id: text('wp:post_id'),
    type: text('wp:post_type'),
    status: text('wp:status'),
    slug: text('wp:post_name'),
    title: text('title'),
    date: text('wp:post_date').slice(0, 10),
    parentId: text('wp:post_parent'),
    content: text('content:encoded'),
    meta,
    terms,
  };
}

/** First value of a meta key, or '' when the post doesn't have it. */
export function metaValue(post: WxrPost, key: string): string {
  return post.meta.get(key)?.[0] ?? '';
}
