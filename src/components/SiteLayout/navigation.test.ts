import { describe, expect, it } from 'vitest';
import { isNavActive, mainNav } from './navigation.ts';

const [portfolio, contact] = mainNav;

describe('isNavActive', () => {
  it('matches the item’s own page, with or without a trailing slash', () => {
    expect(isNavActive(portfolio, '/')).toBe(true);
    expect(isNavActive(contact, '/contact-me')).toBe(true);
    expect(isNavActive(contact, '/contact-me/')).toBe(true);
  });

  it('keeps Portfolio active on category, tag and item pages', () => {
    expect(isNavActive(portfolio, '/portfolio-category/fine/')).toBe(true);
    expect(isNavActive(portfolio, '/portfolio-tag/disney/')).toBe(true);
    expect(isNavActive(portfolio, '/portfolio-item/wall-e-necklace/')).toBe(true);
    expect(isNavActive(portfolio, '/resume/')).toBe(false);
    expect(isNavActive(contact, '/')).toBe(false);
  });
});
