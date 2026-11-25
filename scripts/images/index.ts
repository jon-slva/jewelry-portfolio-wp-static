import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { copyFile, mkdir, readdir, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import type { MediaManifest } from '../../src/content/media.ts';
import { CONTENT_DIR, ROOT_DIR, readContent, writeJson } from '../lib/content-files.ts';
import { collectMediaPaths } from './collect.ts';
import { generateImage } from './generate.ts';

// npm run images: makes every image and video the content uses ready for the web.
// Runs automatically before `npm run dev` and `npm run build`.
//
// - Images get WebP copies at several widths plus a JPEG fallback (generate.ts).
//   Videos are already web-ready and are copied as they are.
// - Output goes to public/img/, and the list of it to src/generated/media.json.
//   Both are git-ignored: they're rebuilt from the originals in src/content/media/.
// - Unchanged files are skipped, so only the first run is slow.
// - Output for files the content no longer uses is deleted.

const PUBLIC_DIR = path.join(ROOT_DIR, 'public');
const OUTPUT_DIR = path.join(PUBLIC_DIR, 'img');
const MANIFEST_FILE = path.join(ROOT_DIR, 'src/generated/media.json');

// Bump to rebuild every image after changing sizes, quality or formats.
const PIPELINE_VERSION = '1';

const started = Date.now();
const sources = collectMediaPaths(await readContent());
const previous = await readManifest();
const manifest: MediaManifest = { images: {}, videos: {} };
let built = 0;

// A few images at a time: sharp already uses several CPU cores per image.
const queue = [...sources.images];
const workers = Array.from({ length: Math.min(4, os.availableParallelism()) }, async () => {
  for (let contentPath = queue.shift(); contentPath; contentPath = queue.shift()) {
    const sourceFile = path.join(CONTENT_DIR, contentPath);
    const hash = await fingerprint(sourceFile);
    const old = previous.images[contentPath];
    if (old?.hash === hash && allExist([old.fallback, ...old.webp.map((v) => v.url)])) {
      manifest.images[contentPath] = old;
      continue;
    }
    manifest.images[contentPath] = await generateImage(
      sourceFile,
      outputBase(contentPath),
      PUBLIC_DIR,
      hash,
    );
    built++;
    console.log(`  built ${contentPath}`);
  }
});
await Promise.all(workers);

for (const contentPath of sources.videos) {
  const sourceFile = path.join(CONTENT_DIR, contentPath);
  const hash = await fingerprint(sourceFile);
  const url = `${outputBase(contentPath)}.mp4`;
  if (previous.videos[contentPath]?.hash !== hash || !allExist([url])) {
    await mkdir(path.dirname(path.join(PUBLIC_DIR, url)), { recursive: true });
    await copyFile(sourceFile, path.join(PUBLIC_DIR, url));
    built++;
    console.log(`  copied ${contentPath}`);
  }
  manifest.videos[contentPath] = { url, hash };
}

await writeJson(MANIFEST_FILE, {
  images: sortKeys(manifest.images),
  videos: sortKeys(manifest.videos),
});
const removed = await removeUnusedFiles(manifest);

const total = sources.images.length + sources.videos.length;
const seconds = ((Date.now() - started) / 1000).toFixed(1);
console.log(
  `Media: ${sources.images.length} images and ${sources.videos.length} videos in use, ` +
    `${built} built, ${total - built} unchanged` +
    `${removed ? `, ${removed} old files removed` : ''} (${seconds}s).`,
);

// ---- Helpers ----

/** media/<folder>/<name>.<ext> -> img/<folder>/<name> */
function outputBase(contentPath: string): string {
  return contentPath.replace(/^media\//, 'img/').replace(/\.[^.]+$/, '');
}

/** Short hash of the file's contents (plus the pipeline version), to spot changes. */
async function fingerprint(file: string): Promise<string> {
  return createHash('sha1')
    .update(PIPELINE_VERSION)
    .update(await readFile(file))
    .digest('hex')
    .slice(0, 12);
}

function allExist(urls: string[]): boolean {
  return urls.every((url) => existsSync(path.join(PUBLIC_DIR, url)));
}

function sortKeys<T>(record: Record<string, T>): Record<string, T> {
  return Object.fromEntries(Object.entries(record).sort(([a], [b]) => a.localeCompare(b)));
}

async function readManifest(): Promise<MediaManifest> {
  try {
    const data = JSON.parse(await readFile(MANIFEST_FILE, 'utf8')) as Partial<MediaManifest>;
    return { images: data.images ?? {}, videos: data.videos ?? {} };
  } catch {
    return { images: {}, videos: {} };
  }
}

/** Deletes files in public/img/ that the manifest doesn't list. Returns how many. */
async function removeUnusedFiles(current: MediaManifest): Promise<number> {
  const keep = new Set([
    ...Object.values(current.images).flatMap((info) => [
      info.fallback,
      ...info.webp.map((v) => v.url),
    ]),
    ...Object.values(current.videos).map((info) => info.url),
  ]);
  const entries = await readdir(OUTPUT_DIR, { recursive: true, withFileTypes: true }).catch(
    () => [],
  );
  let removed = 0;
  for (const entry of entries) {
    if (!entry.isFile()) continue;
    const url = path
      .relative(PUBLIC_DIR, path.join(entry.parentPath, entry.name))
      .split(path.sep)
      .join('/');
    if (!keep.has(url)) {
      await rm(path.join(PUBLIC_DIR, url));
      removed++;
    }
  }
  return removed;
}
