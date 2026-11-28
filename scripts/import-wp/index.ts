import { existsSync } from 'node:fs';
import { copyFile, mkdir, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { parse } from 'node-html-parser';
import type { Item, Site } from '../../src/content/schema.ts';
import { CONTENT_DIR, ROOT_DIR, writeJson } from '../lib/content-files.ts';
import {
  parseFilterOrder,
  parseGridColumns,
  parseGridOrder,
  parseItemPage,
} from './legacy-html.ts';
import { mapItem, mediaFileName } from './map-item.ts';
import {
  buildGrid,
  collectRedirects,
  collectTerms,
  DEFAULT_GRID_SETTINGS,
  normalizeSpellings,
} from './map-site.ts';
import { renderReport } from './report.ts';
import type { MediaCopy } from './types.ts';
import { parseWxr } from './wxr.ts';

// One-off import of the WordPress site into src/content/.
//
//   npm run import:wp            first import
//   npm run import:wp -- --force replace existing content (loses any edits made since)
//
// Reads the WXR export in _source/ (never committed) and the static HTML
// export in legacy/wp-export/, then writes the content files, copies the
// images and writes docs/migration-report.md.

const SOURCE_DIR = path.join(ROOT_DIR, '_source');
const LEGACY_DIR = path.join(ROOT_DIR, 'legacy/wp-export');
const UPLOADS_DIR = path.join(LEGACY_DIR, 'wp-content/uploads');
const REPORT_FILE = path.join(ROOT_DIR, 'docs/migration-report.md');

/** Items whose body is shown before/after in the report: one Visual Composer post, one simple post. */
const SAMPLE_SLUGS = ['wall-e-necklace', 'reza-ruban-ring'];

async function main() {
  const force = process.argv.includes('--force');
  const existingItems = (await readdir(path.join(CONTENT_DIR, 'items')).catch(() => [])).filter(
    (f) => f.endsWith('.json'),
  );
  if (existingItems.length && !force) {
    fail(
      `src/content/items/ already has ${existingItems.length} items. Re-importing replaces them and ` +
        'their images, losing any edits. Run `npm run import:wp -- --force` to do it anyway.',
    );
  }

  // ---- Read the sources ----
  const xmlFiles = (await readdir(SOURCE_DIR).catch(() => [])).filter((f) => f.endsWith('.xml'));
  if (xmlFiles.length !== 1)
    fail(`Expected one WordPress export (.xml) in _source/, found ${xmlFiles.length}.`);
  const sourceFile = xmlFiles[0];
  const wxr = parseWxr(await readFile(path.join(SOURCE_DIR, sourceFile), 'utf8'));
  const homeHtml = await readFile(path.join(LEGACY_DIR, 'index.html'), 'utf8');

  const published = wxr.posts.filter(
    (post) => post.type === 'portfolio-item' && post.status === 'publish',
  );
  console.log(`Importing ${published.length} published portfolio items from ${sourceFile}...`);

  // ---- Map items ----
  const itemNotes = new Map<string, string[]>();
  const copies: MediaCopy[] = [];
  const items: Item[] = [];
  for (const post of published) {
    const pageFile = path.join(LEGACY_DIR, 'portfolio-item', post.slug, 'index.html');
    const legacy = existsSync(pageFile)
      ? parseItemPage(await readFile(pageFile, 'utf8'))
      : undefined;
    const mapped = mapItem(post, wxr, legacy);
    if (!legacy) mapped.notes.push('No page in the HTML export to check against.');
    items.push(mapped.item);
    copies.push(...mapped.copies);
    itemNotes.set(post.slug, mapped.notes);
  }
  const spellingNotes = normalizeSpellings(items);

  const categories = collectTerms(published, 'portfolio-category', parseFilterOrder(homeHtml));
  const tags = collectTerms(published, 'portfolio-tag');
  const { grid, notes: gridNotes } = buildGrid(items, parseGridOrder(homeHtml));
  const pageColumns = parseGridColumns(homeHtml);
  if (pageColumns && pageColumns !== DEFAULT_GRID_SETTINGS.columns.wide) {
    gridNotes.push(
      `The old home page used ${pageColumns} columns; the default is ${DEFAULT_GRID_SETTINGS.columns.wide}.`,
    );
  }
  const { redirects, skipped: skippedRedirects } = collectRedirects(published);

  // ---- Resume PDF and its preview image (from the old Resume page) ----
  const resumeHtml = parse(await readFile(path.join(LEGACY_DIR, 'resume/index.html'), 'utf8'));
  const pdfUrl = resumeHtml.querySelector('a[href$=".pdf"]')?.getAttribute('href') ?? '';
  const previewUrl =
    resumeHtml
      .querySelectorAll('img')
      .map((img) => img.getAttribute('src') ?? '')
      .find((src) => /resume/i.test(src)) ?? '';
  const resumeCopies: MediaCopy[] = [pdfUrl, previewUrl]
    .filter(Boolean)
    .map((url) => ({ from: url.split('/').pop() ?? '', to: `media/site/${mediaFileName(url)}` }));
  const resumeNotes = [
    `PDF: \`${resumeCopies[0]?.to ?? 'not found'}\``,
    `Preview image: \`${resumeCopies[1]?.to ?? 'not found'}\`. It's a small (232×300) image of the **2018** resume, while the PDF is from 2023, so a new preview is worth making.`,
  ];

  // ---- Write content ----
  await rm(path.join(CONTENT_DIR, 'items'), { recursive: true, force: true });
  for (const folder of await readdir(path.join(CONTENT_DIR, 'media')).catch(() => [])) {
    if (folder !== 'site')
      await rm(path.join(CONTENT_DIR, 'media', folder), { recursive: true, force: true });
  }

  const bySlug = new Map(items.map((item) => [item.slug, item]));
  const ordered = grid.items.map((slug) => bySlug.get(slug)!);
  for (const item of ordered)
    await writeJson(path.join(CONTENT_DIR, 'items', `${item.slug}.json`), item);
  await writeJson(path.join(CONTENT_DIR, 'categories.json'), categories);
  await writeJson(path.join(CONTENT_DIR, 'tags.json'), tags);
  await writeJson(path.join(CONTENT_DIR, 'grid.json'), grid);
  await writeJson(path.join(CONTENT_DIR, 'redirects.json'), redirects);

  const siteFile = path.join(CONTENT_DIR, 'site.json');
  const site = JSON.parse(await readFile(siteFile, 'utf8')) as Site;
  if (resumeCopies.length === 2)
    site.resume = { pdf: resumeCopies[0].to, preview: resumeCopies[1].to };
  await writeJson(siteFile, site);

  // ---- Copy files ----
  const missingFiles: string[] = [];
  let copiedBytes = 0;
  for (const { from, to } of [...copies, ...resumeCopies]) {
    const source = path.join(UPLOADS_DIR, from);
    if (!existsSync(source)) {
      missingFiles.push(from);
      continue;
    }
    const target = path.join(CONTENT_DIR, to);
    await mkdir(path.dirname(target), { recursive: true });
    await copyFile(source, target);
    copiedBytes += (await stat(target)).size;
  }

  // ---- What was left behind ----
  const imported = new Set(published.map((post) => post.id));
  const skippedPosts = new Map<string, number>();
  for (const post of wxr.posts) {
    if (imported.has(post.id)) continue;
    const kind = `${post.type} / ${post.status}`;
    skippedPosts.set(kind, (skippedPosts.get(kind) ?? 0) + 1);
  }
  const usedUploads = new Set(copies.map((copy) => copy.from));
  const attachments = wxr.posts.filter((post) => post.type === 'attachment');
  const unusedItemAttachments = attachments
    .filter((post) => imported.has(post.parentId))
    .map((post) => post.meta.get('_wp_attached_file')?.[0] ?? '')
    .filter((file) => file && !usedUploads.has(file))
    .sort();
  const otherAttachments = attachments.length - usedUploads.size - unusedItemAttachments.length;

  // ---- Report ----
  const report = renderReport({
    sourceFile,
    items: ordered,
    itemNotes,
    spellingNotes,
    gridNotes,
    categories: categories.length,
    tags: tags.length,
    redirects: redirects.length,
    skippedRedirects,
    copiedFiles: copies.length + resumeCopies.length - missingFiles.length,
    copiedBytes,
    missingFiles,
    skippedPosts,
    unusedItemAttachments,
    otherAttachments,
    resumeNotes,
    samples: SAMPLE_SLUGS.flatMap((slug) => {
      const post = published.find((p) => p.slug === slug);
      const item = bySlug.get(slug);
      return post && item ? [{ slug, before: post.content, after: item }] : [];
    }),
  });
  await writeFile(REPORT_FILE, report);

  console.log(
    `Done: ${items.length} items, ${copies.length + resumeCopies.length - missingFiles.length} files ` +
      `(${(copiedBytes / 1024 / 1024).toFixed(1)} MB), ${categories.length} categories, ${tags.length} tags, ` +
      `${redirects.length} redirects.`,
  );
  if (missingFiles.length)
    console.warn(`Missing files (see the report): ${missingFiles.join(', ')}`);
  console.log('Report: docs/migration-report.md. Next: npm run validate');
}

function fail(message: string): never {
  console.error(message);
  process.exit(1);
}

await main();
