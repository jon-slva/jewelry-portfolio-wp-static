import { basePath } from './basePath.ts';

// Where the built site will be published. Used for absolute links that leave
// the site: canonical URLs, share previews (Open Graph), the sitemap.
//
//   final site (default):  https://jewelrybyjs.com/
//   GitHub Pages preview:  SITE_ORIGIN=https://jon-slva.github.io BASE_PATH=/jewelry-portfolio-wp-static/
//                          -> https://jon-slva.github.io/jewelry-portfolio-wp-static/

export const DEFAULT_ORIGIN = 'https://jewelrybyjs.com';

/** "https://example.com" from "https://example.com/" or "", with the default as fallback. */
export function normalizeOrigin(raw: string | undefined): string {
  const trimmed = (raw ?? '').trim().replace(/\/+$/, '');
  return trimmed || DEFAULT_ORIGIN;
}

/** Full address of the site's home page, always ending in "/". */
export const siteUrl = `${normalizeOrigin(process.env.SITE_ORIGIN)}${basePath}`;

/**
 * Whether search engines may index this build. Only the final site should be
 * indexed: a preview copy would compete with it (and with the old WordPress
 * site while that's still live). Previews (any non-root base path) are
 * marked noindex unless SITE_INDEX=true says otherwise.
 */
export const indexable = process.env.SITE_INDEX
  ? process.env.SITE_INDEX === 'true'
  : basePath === '/';
