import { describe, expect, it } from 'vitest';
import { DEFAULT_ORIGIN, normalizeOrigin } from './site.ts';

describe('normalizeOrigin', () => {
  it('defaults to the final domain', () => {
    expect(normalizeOrigin(undefined)).toBe(DEFAULT_ORIGIN);
    expect(normalizeOrigin('  ')).toBe(DEFAULT_ORIGIN);
  });

  it('drops trailing slashes', () => {
    expect(normalizeOrigin('https://jon-slva.github.io/')).toBe('https://jon-slva.github.io');
  });
});
