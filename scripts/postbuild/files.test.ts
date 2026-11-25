import { describe, expect, it } from 'vitest';
import { redirectHtml, robotsTxt, sitemapXml } from './files.ts';

describe('sitemapXml', () => {
  it('lists each page as an absolute URL', () => {
    const xml = sitemapXml('https://example.com/', ['/', '/portfolio-item/ring/']);
    expect(xml).toContain('<loc>https://example.com/</loc>');
    expect(xml).toContain('<loc>https://example.com/portfolio-item/ring/</loc>');
    expect(xml.startsWith('<?xml')).toBe(true);
  });
});

describe('robotsTxt', () => {
  it('allows the final site and points to the sitemap', () => {
    expect(robotsTxt('https://example.com/', true)).toContain(
      'Sitemap: https://example.com/sitemap.xml',
    );
  });

  it('keeps search engines out of previews', () => {
    expect(robotsTxt('https://example.com/', false)).toContain('Disallow: /');
  });
});

describe('redirectHtml', () => {
  it('forwards to the target path and names its full address as canonical', () => {
    const html = redirectHtml('/portfolio-item/ring/', 'https://example.com/portfolio-item/ring/');
    expect(html).toContain('content="0; url=/portfolio-item/ring/"');
    expect(html).toContain('rel="canonical" href="https://example.com/portfolio-item/ring/"');
  });
});
