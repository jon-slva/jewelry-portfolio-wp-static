import { existsSync } from 'node:fs';
import { mkdir, readdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { basePath } from '../../config/basePath.ts';
import { contentPaths, FIXED_PAGES, readItemSummaries } from '../../config/contentPaths.ts';
import { indexable, siteUrl } from '../../config/site.ts';
import type { Redirect } from '../../src/content/schema.ts';
import { CONTENT_DIR, ROOT_DIR } from '../lib/content-files.ts';
import { redirectHtml, robotsTxt, sitemapXml } from './files.ts';

// Runs automatically after `npm run build`. Turns build/client/ into exactly
// what gets published on GitHub Pages:
//
// - With a base path (preview builds), React Router writes the pages into
//   build/client/<base>/. GitHub Pages already serves the site from <base>/,
//   so they're moved up to build/client/.
// - The fallback page for addresses that weren't pre-rendered becomes
//   404.html, which GitHub Pages serves for any unknown URL.
// - .nojekyll stops GitHub Pages from running Jekyll, which would hide the
//   "_.data" files the pages load their data from.
// - sitemap.xml (final site only), robots.txt, and redirect pages for old
//   item URLs (src/content/redirects.json).

const OUT = path.join(ROOT_DIR, 'build/client');

// ---- Layout ----
const baseDir = path.join(OUT, basePath.replace(/^\/|\/$/g, ''));
if (basePath !== '/' && existsSync(baseDir)) {
  // The fallback was written to the top level, where the base folder's own index.html goes.
  await rename(path.join(OUT, 'index.html'), path.join(OUT, '404.html'));
  for (const entry of await readdir(baseDir)) {
    await rename(path.join(baseDir, entry), path.join(OUT, entry));
  }
  await rm(baseDir, { recursive: true });
} else if (existsSync(path.join(OUT, '__spa-fallback.html'))) {
  await rename(path.join(OUT, '__spa-fallback.html'), path.join(OUT, '404.html'));
}
await writeFile(path.join(OUT, '.nojekyll'), '');

// ---- Search engines ----
const pages = [...FIXED_PAGES, ...contentPaths(readItemSummaries(CONTENT_DIR))];
if (indexable) await writeFile(path.join(OUT, 'sitemap.xml'), sitemapXml(siteUrl, pages));
await writeFile(path.join(OUT, 'robots.txt'), robotsTxt(siteUrl, indexable));

// ---- Old item URLs ----
const redirects = JSON.parse(
  await readFile(path.join(CONTENT_DIR, 'redirects.json'), 'utf8'),
) as Redirect[];
for (const { from, to } of redirects) {
  const dir = path.join(OUT, 'portfolio-item', from);
  if (existsSync(path.join(dir, 'index.html'))) continue; // never replace a real page
  await mkdir(dir, { recursive: true });
  const target = `portfolio-item/${to}/`;
  await writeFile(
    path.join(dir, 'index.html'),
    redirectHtml(`${basePath}${target}`, `${siteUrl}${target}`),
  );
}

console.log(
  `Post-build: ${pages.length} pages for ${siteUrl}` +
    `${indexable ? ', sitemap.xml' : ' (preview: not indexed)'}, robots.txt, 404.html, ` +
    `${redirects.length} redirect${redirects.length === 1 ? '' : 's'}.`,
);
