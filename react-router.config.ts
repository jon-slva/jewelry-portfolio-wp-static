import type { Config } from '@react-router/dev/config';
import { basePath } from './config/basePath.ts';
import { itemPaths } from './config/contentPaths.ts';

export default {
  // App source lives in src/ (React Router defaults to app/).
  appDirectory: 'src',

  // No server: every page is pre-rendered to a static HTML file at build time,
  // which is what GitHub Pages needs (deep links and refresh work without a 404 hack).
  ssr: false,

  basename: basePath,

  // Ship the full route manifest with the first page. Lazy discovery needs a
  // server endpoint, which a static host doesn't have.
  routeDiscovery: { mode: 'initial' },

  // Pages to render at build time: the fixed pages plus one per published item.
  // TODO(phase 1d): category and tag pages.
  prerender: () => ['/', '/resume/', '/contact-me/', ...itemPaths('src/content')],

  // TODO(phase 1e): with a non-root BASE_PATH, pages are written to
  // build/client/<base>/... - the deploy step must flatten that folder into the
  // published root (and add 404.html) for GitHub Pages.
} satisfies Config;
