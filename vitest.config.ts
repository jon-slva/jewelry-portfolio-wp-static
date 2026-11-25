import { defineConfig } from 'vitest/config';

// Kept separate from vite.config.ts so tests run without the React Router plugin.
// Unit tests cover data logic only (see docs/PLAN.md -> Testing approach).
export default defineConfig({
  // Same constants as vite.config.ts, with fixed test values.
  define: {
    __SITE_URL__: JSON.stringify('https://example.com/'),
    __SITE_INDEXABLE__: 'true',
  },
  test: {
    include: ['src/**/*.test.ts', 'scripts/**/*.test.ts', 'config/**/*.test.ts'],
    environment: 'node',
  },
});
