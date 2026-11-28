import type { Config } from '@react-router/dev/config';
import { basePath } from './config/basePath.ts';
import { contentPaths, FIXED_PAGES, readItemSummaries } from './config/contentPaths.ts';

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

  // Pages to render at build time: the fixed pages, plus one per published item
  // and per category and tag in use.
  prerender: () => [...FIXED_PAGES, ...contentPaths(readItemSummaries('src/content'))],

  // After the build, scripts/postbuild/ rearranges build/client/ for GitHub
  // Pages (base path folder, 404.html) and adds sitemap.xml and robots.txt.
} satisfies Config;
