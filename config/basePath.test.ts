import { describe, expect, it } from 'vitest';
import { normalizeBasePath } from './basePath.ts';

describe('normalizeBasePath', () => {
  it('defaults to the site root', () => {
    expect(normalizeBasePath(undefined)).toBe('/');
    expect(normalizeBasePath('')).toBe('/');
    expect(normalizeBasePath('/')).toBe('/');
  });

  it('always adds a leading and trailing slash', () => {
    expect(normalizeBasePath('jewelry-portfolio-wp-static')).toBe('/jewelry-portfolio-wp-static/');
    expect(normalizeBasePath('/jewelry-portfolio-wp-static')).toBe('/jewelry-portfolio-wp-static/');
    expect(normalizeBasePath('//jewelry-portfolio-wp-static//')).toBe(
      '/jewelry-portfolio-wp-static/',
    );
  });
});
