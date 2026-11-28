/**
 * The URL path the site is served from.
 *
 * - `/` (default) for the custom domain, e.g. https://jewelrybyjs.com/
 * - `/jewelry-portfolio-wp-static/` for GitHub Pages previews, set with:
 *   BASE_PATH=/jewelry-portfolio-wp-static/ npm run build
 *
 * Vite and React Router both read this, so asset URLs and links stay in sync.
 */
export function normalizeBasePath(raw: string | undefined): string {
  const trimmed = (raw ?? '').trim().replace(/^\/+|\/+$/g, '');
  return trimmed ? `/${trimmed}/` : '/';
}

export const basePath = normalizeBasePath(process.env.BASE_PATH);
