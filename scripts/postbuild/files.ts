// The extra files a static host needs next to the pre-rendered pages, as
// plain text. Kept free of file handling so they can be tested.

/** sitemap.xml: every page search engines should know about. */
export function sitemapXml(siteUrl: string, paths: string[]): string {
  const urls = paths
    .map((path) => `  <url><loc>${escapeXml(siteUrl + path.replace(/^\//, ''))}</loc></url>`)
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
}

/** robots.txt: the final site invites search engines in; previews keep them out. */
export function robotsTxt(siteUrl: string, indexable: boolean): string {
  return indexable
    ? `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl}sitemap.xml\n`
    : 'User-agent: *\nDisallow: /\n';
}

/**
 * A page that forwards an old address to the new one. A static host can't
 * send real (301) redirects, so this does it in the browser: instantly with
 * a meta refresh, with a link as a fallback. The canonical tag tells search
 * engines which address to keep.
 *
 * @param targetPath   where to go, as a path on this site ("/base/portfolio-item/x/"),
 *                     so it also works on a local preview
 * @param canonicalUrl the target's full public address
 */
export function redirectHtml(targetPath: string, canonicalUrl: string): string {
  const url = escapeXml(targetPath);
  const canonical = escapeXml(canonicalUrl);
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Moved</title>
<meta name="robots" content="noindex">
<link rel="canonical" href="${canonical}">
<meta http-equiv="refresh" content="0; url=${url}">
</head>
<body>
<p>This page has moved to <a href="${url}">${url}</a>.</p>
</body>
</html>
`;
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
