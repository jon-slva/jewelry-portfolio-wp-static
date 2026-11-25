import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

// Reading and writing src/content/ from Node scripts (import, validate, and
// later the local admin). The site itself imports these files at build time.

export const ROOT_DIR = path.resolve(import.meta.dirname, '../..');
export const CONTENT_DIR = path.join(ROOT_DIR, 'src/content');

/** Writes JSON the same way everywhere (2-space indent, final newline) so diffs stay small. */
export async function writeJson(file: string, data: unknown): Promise<void> {
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, `${JSON.stringify(data, null, 2)}\n`);
}

/** A content JSON file as read from disk. `data` is unchecked until validated. */
export interface ContentFile {
  /** Path inside src/content, e.g. "items/reza-ruban-ring.json". */
  path: string;
  data?: unknown;
  /** Set when the file is missing or isn't valid JSON. */
  error?: string;
}

/** Everything in src/content/, unvalidated. */
export interface ContentSnapshot {
  site: ContentFile;
  grid: ContentFile;
  categories: ContentFile;
  tags: ContentFile;
  redirects: ContentFile;
  items: ContentFile[];
  /** Every file under media/, as "media/<folder>/<file>" with exact letter case. */
  mediaFiles: Set<string>;
}

export async function readContent(dir = CONTENT_DIR): Promise<ContentSnapshot> {
  const read = async (file: string): Promise<ContentFile> => {
    try {
      return { path: file, data: JSON.parse(await readFile(path.join(dir, file), 'utf8')) };
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      return {
        path: file,
        error: code === 'ENOENT' ? 'file is missing' : `invalid JSON: ${(error as Error).message}`,
      };
    }
  };

  const itemNames = (await listFiles(path.join(dir, 'items'))).filter((name) =>
    name.endsWith('.json'),
  );
  const mediaFiles = await listFiles(path.join(dir, 'media'));

  return {
    site: await read('site.json'),
    grid: await read('grid.json'),
    categories: await read('categories.json'),
    tags: await read('tags.json'),
    redirects: await read('redirects.json'),
    items: await Promise.all(itemNames.sort().map((name) => read(`items/${name}`))),
    mediaFiles: new Set(
      mediaFiles
        .filter((name) => !name.split('/').pop()?.startsWith('.'))
        .map((name) => `media/${name}`),
    ),
  };
}

/** Files under a folder (recursively), as forward-slash paths relative to it. Empty if it doesn't exist. */
async function listFiles(dir: string): Promise<string[]> {
  try {
    const entries = await readdir(dir, { recursive: true, withFileTypes: true });
    return entries
      .filter((entry) => entry.isFile())
      .map((entry) =>
        path.relative(dir, path.join(entry.parentPath, entry.name)).split(path.sep).join('/'),
      );
  } catch {
    return [];
  }
}
