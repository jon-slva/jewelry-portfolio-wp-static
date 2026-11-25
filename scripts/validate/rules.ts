import type { z } from 'zod';
import {
  categoriesSchema,
  gridSchema,
  itemSchema,
  redirectsSchema,
  siteSchema,
  tagsSchema,
  type Item,
} from '../../src/content/schema.ts';
import type { ContentFile, ContentSnapshot } from '../lib/content-files.ts';

// Checks all of src/content/ and lists every problem found. Kept separate
// from the command (index.ts) so each rule can be tested with small samples.
//
// Errors fail `npm run validate` (and so the build). Warnings are printed but
// don't fail it.

export interface ValidationResult {
  errors: string[];
  warnings: string[];
}

export function validateContent(content: ContentSnapshot): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // ---- 1. Every file matches its schema ----
  const check = <T>(file: ContentFile, schema: z.ZodType<T>): T | undefined => {
    if (file.error) {
      errors.push(`${file.path}: ${file.error}`);
      return undefined;
    }
    const result = schema.safeParse(file.data);
    if (result.success) return result.data;
    for (const issue of result.error.issues) {
      const where = issue.path.length ? ` → ${issue.path.join('.')}` : '';
      errors.push(`${file.path}${where}: ${issue.message}`);
    }
    return undefined;
  };

  const site = check(content.site, siteSchema);
  const grid = check(content.grid, gridSchema);
  const categories = check(content.categories, categoriesSchema);
  const tags = check(content.tags, tagsSchema);
  const redirects = check(content.redirects, redirectsSchema);
  const items = content.items
    .map((file) => ({ file, item: check(file, itemSchema) }))
    .filter((entry): entry is { file: ContentFile; item: Item } => entry.item !== undefined);

  // ---- 2. Slugs are unique and match their file names ----
  const itemSlugs = new Set<string>();
  for (const { file, item } of items) {
    if (file.path !== `items/${item.slug}.json`) {
      errors.push(
        `${file.path}: slug "${item.slug}" doesn't match the file name (expected items/${item.slug}.json)`,
      );
    }
    if (itemSlugs.has(item.slug)) errors.push(`${file.path}: duplicate slug "${item.slug}"`);
    itemSlugs.add(item.slug);
  }
  // Items that exist as files, even if invalid, so one bad item file doesn't
  // also show up as grid and redirect errors.
  const validFiles = new Set(items.map(({ file }) => file));
  const existingSlugs = new Set([
    ...itemSlugs,
    ...content.items
      .filter((file) => !validFiles.has(file))
      .map((file) => file.path.replace(/^items\/|\.json$/g, '')),
  ]);
  const categorySlugs = uniqueSlugs('categories.json', categories ?? [], errors);
  const tagSlugs = uniqueSlugs('tags.json', tags ?? [], errors);

  // ---- 3. Items only use known categories and tags ----
  for (const { file, item } of items) {
    if (categories) {
      for (const slug of item.categories) {
        if (!categorySlugs.has(slug))
          errors.push(`${file.path}: unknown category "${slug}" (not in categories.json)`);
      }
    }
    if (tags) {
      for (const slug of item.tags) {
        if (!tagSlugs.has(slug))
          errors.push(`${file.path}: unknown tag "${slug}" (not in tags.json)`);
      }
    }
  }

  // ---- 4. Every referenced file exists (exact letter case) ----
  const referenced = new Set<string>();
  const requireFile = (owner: string, file: string) => {
    referenced.add(file);
    if (!content.mediaFiles.has(file)) errors.push(`${owner}: file not found: src/content/${file}`);
  };
  if (site) {
    requireFile('site.json → logo', site.logo);
    requireFile('site.json → resume.pdf', site.resume.pdf);
    requireFile('site.json → resume.preview', site.resume.preview);
  }
  for (const { file, item } of items) {
    requireFile(`${file.path} → cover`, item.cover);
    item.media.forEach((media, i) => {
      if (media.type === 'image') requireFile(`${file.path} → media.${i}`, media.file);
    });
  }

  // ---- 5. grid.json lists every item exactly once, and nothing else ----
  if (grid) {
    const seen = new Set<string>();
    for (const slug of grid.items) {
      if (seen.has(slug)) errors.push(`grid.json: "${slug}" is listed more than once`);
      else if (!existingSlugs.has(slug)) errors.push(`grid.json: "${slug}" has no item file`);
      seen.add(slug);
    }
    for (const slug of existingSlugs) {
      if (!seen.has(slug)) errors.push(`grid.json: item "${slug}" is missing from the grid`);
    }
  }

  // ---- 6. Redirects point from free URLs to real items ----
  for (const { from, to } of redirects ?? []) {
    if (existingSlugs.has(from))
      errors.push(`redirects.json: "${from}" is a current item, so it can't redirect`);
    if (!existingSlugs.has(to))
      errors.push(`redirects.json: "${from}" points to "${to}", which has no item file`);
  }

  // ---- Warnings: files nothing uses ----
  for (const file of content.mediaFiles) {
    if (!referenced.has(file) && !file.startsWith('media/site/')) {
      warnings.push(`src/content/${file} isn't used by any item`);
    }
  }

  return { errors, warnings };
}

function uniqueSlugs(fileName: string, terms: { slug: string }[], errors: string[]): Set<string> {
  const slugs = new Set<string>();
  for (const { slug } of terms) {
    if (slugs.has(slug)) errors.push(`${fileName}: duplicate slug "${slug}"`);
    slugs.add(slug);
  }
  return slugs;
}
