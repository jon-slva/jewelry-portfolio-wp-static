import { reactRouter } from '@react-router/dev/vite';
import { defineConfig } from 'vite';
import { basePath } from './config/basePath.ts';

export default defineConfig({
  base: basePath,
  plugins: [
    reactRouter(),
    // TODO(phase 2): local admin plugin (dev server only).
  ],
});
