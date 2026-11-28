import { describe, expect, it } from 'vitest';
import { pickVariant, srcSet, variantWidths } from './media.ts';

describe('variantWidths', () => {
  it('uses every target width for a large original', () => {
    expect(variantWidths(3300)).toEqual([400, 800, 1200, 1920]);
  });

  it('never enlarges: stops below the original and adds its own width', () => {
    expect(variantWidths(1406)).toEqual([400, 800, 1200, 1406]);
    expect(variantWidths(680)).toEqual([400, 680]);
    expect(variantWidths(232)).toEqual([232]);
  });

  it('does not repeat a width the original already matches', () => {
    expect(variantWidths(800, [400, 800])).toEqual([400, 800]);
  });
});

describe('srcSet', () => {
  it('prefixes the base path and lists each width', () => {
    const variants = [
      { width: 400, url: 'img/ring/front-400.webp' },
      { width: 800, url: 'img/ring/front-800.webp' },
    ];
    expect(srcSet(variants, '/jewelry-portfolio-wp-static/')).toBe(
      '/jewelry-portfolio-wp-static/img/ring/front-400.webp 400w, /jewelry-portfolio-wp-static/img/ring/front-800.webp 800w',
    );
  });
});

describe('pickVariant', () => {
  const variants = [400, 800, 1200].map((width) => ({ width, url: `img/a-${width}.webp` }));

  it('picks the smallest variant that is wide enough', () => {
    expect(pickVariant(variants, 700)?.width).toBe(800);
    expect(pickVariant(variants, 800)?.width).toBe(800);
  });

  it('falls back to the largest when none is wide enough', () => {
    expect(pickVariant(variants, 2000)?.width).toBe(1200);
    expect(pickVariant([], 400)).toBeUndefined();
  });
});
