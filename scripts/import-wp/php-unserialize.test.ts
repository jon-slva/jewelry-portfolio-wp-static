import { describe, expect, it } from 'vitest';
import { phpUnserialize } from './php-unserialize.ts';

describe('phpUnserialize', () => {
  it('reads scalars', () => {
    expect(phpUnserialize('s:5:"video";')).toBe('video');
    expect(phpUnserialize('i:42;')).toBe(42);
    expect(phpUnserialize('d:1.5;')).toBe(1.5);
    expect(phpUnserialize('b:1;')).toBe(true);
    expect(phpUnserialize('N;')).toBeNull();
  });

  it('reads nested arrays as objects keyed like PHP', () => {
    expect(phpUnserialize('a:1:{i:0;a:2:{s:4:"type";s:7:"youtube";s:2:"id";N;}}')).toEqual({
      0: { type: 'youtube', id: null },
    });
  });

  it('counts string lengths in bytes, not characters', () => {
    // "é" is 2 bytes in UTF-8.
    expect(phpUnserialize('s:5:"café";')).toBe('café');
  });

  it('rejects broken input', () => {
    expect(() => phpUnserialize('s:9:"short";')).toThrow();
    expect(() => phpUnserialize('x:1;')).toThrow();
  });
});
