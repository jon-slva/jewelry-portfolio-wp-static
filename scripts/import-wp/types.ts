// Shapes the importer works with, between reading the WordPress export and
// writing src/content/. Content file types themselves live in src/content/schema.ts.

/** A post of any type from the WXR export (portfolio item, attachment, page, ...). */
export interface WxrPost {
  id: string;
  type: string;
  status: string;
  slug: string;
  title: string;
  /** YYYY-MM-DD */
  date: string;
  parentId: string;
  content: string;
  /** Post meta. A key can appear more than once (e.g. _wp_old_slug). */
  meta: Map<string, string[]>;
  terms: WxrTermRef[];
}

export interface WxrTermRef {
  taxonomy: string;
  slug: string;
  name: string;
}

export interface WxrExport {
  posts: WxrPost[];
  byId: Map<string, WxrPost>;
}

/** Title, subtitle, description, software and client pulled out of a post body. */
export interface ItemText {
  title: string;
  subtitle: string;
  description: string;
  software: string[];
  client: string;
  /** Anything unexpected left over after cleaning, for the migration report. */
  leftovers: string[];
}

/** What the old site's rendered item page shows (the HTML export). */
export interface LegacyItemPage {
  layout: 'small-masonry' | 'small-images' | 'gallery';
  /** Masonry/gallery column count, when the page shows one. */
  columns?: number;
  /** Image file names in display order, with whether each is a large masonry tile. */
  images: { file: string; large: boolean }[];
  youtubeIds: string[];
}

/** One file to copy from the WordPress uploads into src/content/media/. */
export interface MediaCopy {
  /** Path relative to the uploads folder. */
  from: string;
  /** Content path, e.g. media/<slug>/<file>. */
  to: string;
}
