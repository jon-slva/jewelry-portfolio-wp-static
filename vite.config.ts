import { reactRouter } from '@react-router/dev/vite';
import { defineConfig } from 'vite';
import { basePath } from './config/basePath.ts';

export default defineConfig({
  base: basePath,
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
