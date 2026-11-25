import { z } from 'zod';

// The shape of every content file in src/content/, defined once.
// - `npm run validate` checks the files against these schemas.
// - The TypeScript types at the bottom are inferred from them, so the
//   types and the validation rules can never drift apart.
// - Objects are strict: an unknown key (usually a typo) is an error.

/** Lowercase words joined by dashes, as used in URLs: `reza-ruban-ring`. */
export const slugSchema = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase letters, numbers and dashes only');

/**
 * A file inside src/content/media/, e.g. `media/reza-ruban-ring/hero.jpg`.
 * Lowercase only: macOS ignores letter case in file names but the Linux
 * build servers don't, so a mismatch would only break after deploying.
 */
export const mediaPathSchema = z
  .string()
  .regex(
    /^media\/[a-z0-9-]+\/[a-z0-9][a-z0-9._-]*\.[a-z0-9]+$/,
    'Use a lowercase path like media/<folder>/<file>.jpg',
  );

// ---- Categories and tags ----

export const termSchema = z.strictObject({
  slug: slugSchema,
  name: z.string().min(1),
});

/** In filter-bar order. */
export const categoriesSchema = z.array(termSchema);
export const tagsSchema = z.array(termSchema);

// ---- Portfolio items ----

/** `large` spans two cells in the masonry layout. Other layouts ignore it. */
export const mediaSizeSchema = z.enum(['normal', 'large']);

export const imageMediaSchema = z.strictObject({
  type: z.literal('image'),
  file: mediaPathSchema,
  alt: z.string(),
  size: mediaSizeSchema,
});

export const youtubeMediaSchema = z.strictObject({
  type: z.literal('youtube'),
  /** The 11-character video id from the YouTube URL. */
  id: z.string().regex(/^[\w-]{11}$/, 'Use the 11-character YouTube video id'),
  title: z.string().min(1),
  size: mediaSizeSchema,
});

export const mediaSchema = z.discriminatedUnion('type', [imageMediaSchema, youtubeMediaSchema]);

/** How an item page arranges its images (see docs/PLAN.md -> Per-item image layouts). */
export const layoutSchema = z.discriminatedUnion('type', [
  z.strictObject({ type: z.literal('masonry'), columns: z.int().min(2).max(3) }),
  z.strictObject({ type: z.literal('stacked') }),
  z.strictObject({ type: z.literal('gallery'), columns: z.int().min(2).max(4) }),
]);

export const itemSchema = z.strictObject({
  title: z.string().min(1),
  /** Also the file name (items/<slug>.json) and the URL: /portfolio-item/<slug>/ */
  slug: slugSchema,
  subtitle: z.string(),
  date: z.iso.date(),
  /** Hidden from the public site, still listed in the admin. */
  draft: z.boolean(),
  /** Shown as a double-size tile on the front-page grid. */
  featured: z.boolean(),
  categories: z.array(slugSchema),
  tags: z.array(slugSchema),
  /** Plain text. A blank line starts a new paragraph. */
  description: z.string(),
  software: z.array(z.string().min(1)),
  client: z.string(),
  /** Front-page grid thumbnail. */
  cover: mediaPathSchema,
  layout: layoutSchema,
  /** Gallery, in display order. */
  media: z.array(mediaSchema),
});

// ---- Front-page grid ----

export const gridSchema = z.strictObject({
  /** Item slugs in display order. Every item (drafts included) appears once. */
  items: z.array(slugSchema),
  /** Tiles per row at each screen width. */
  columns: z.strictObject({
    /** Wider than 1200px */
    wide: z.int().min(1).max(8),
    /** 1025-1200px */
    desktop: z.int().min(1).max(8),
    /** 681-1024px */
    tablet: z.int().min(1).max(8),
    /** Up to 680px */
    phone: z.int().min(1).max(8),
  }),
  /** Space between tiles, in pixels. */
  gap: z.int().min(0).max(80),
});

// ---- Site settings ----

export const siteSchema = z.strictObject({
  title: z.string().min(1),
  tagline: z.string(),
  logo: mediaPathSchema,
  copyright: z.string(),
  social: z.array(z.strictObject({ label: z.string().min(1), url: z.url() })),
  resume: z.strictObject({
    pdf: mediaPathSchema,
    /** Image of the resume's first page, shown on the Resume page. */
    preview: mediaPathSchema,
  }),
});

// ---- Redirects ----

/** Old item URLs that forward to the current one: /portfolio-item/<from>/ -> <to>. */
export const redirectsSchema = z.array(z.strictObject({ from: slugSchema, to: slugSchema }));

// ---- Types (inferred from the schemas above) ----

export type Term = z.infer<typeof termSchema>;
export type MediaSize = z.infer<typeof mediaSizeSchema>;
export type ImageMedia = z.infer<typeof imageMediaSchema>;
export type YoutubeMedia = z.infer<typeof youtubeMediaSchema>;
export type Media = z.infer<typeof mediaSchema>;
export type Layout = z.infer<typeof layoutSchema>;
export type Item = z.infer<typeof itemSchema>;
export type Grid = z.infer<typeof gridSchema>;
export type Site = z.infer<typeof siteSchema>;
export type Redirect = z.infer<typeof redirectsSchema>[number];
