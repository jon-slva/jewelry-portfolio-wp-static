import { reactRouter } from '@react-router/dev/vite';
import { defineConfig } from 'vite';
import { basePath } from './config/basePath.ts';
import { indexable, siteUrl } from './config/site.ts';

export default defineConfig({
  base: basePath,
  // Build-time constants for the site code (declared in src/build-env.d.ts).
  define: {
    __SITE_URL__: JSON.stringify(siteUrl),
    __SITE_INDEXABLE__: JSON.stringify(indexable),
  },
  server: {
    // Don't reload the dev site when build output, the old export or caches
    // change: none of them are part of the running site.
    watch: { ignored: ['**/build/**', '**/legacy/**', '**/_source/**', '**/.cache/**'] },
  },
  plugins: [
    reactRouter(),
    // TODO(phase 2): local admin plugin (dev server only).
  ],
});
