import { parse } from 'node-html-parser';
import type { LegacyItemPage } from './types.ts';

// Reads what the old site actually rendered, from the Simply Static HTML export.
// The XML export is the main source. These pages fill in what it can't tell us
// (the exact front-page order) and double-check layouts and image sizes.

const COLUMN_WORDS: Record<string, number> = { two: 2, three: 3, four: 4, five: 5 };

/** Item slugs in front-page grid order. */
export function parseGridOrder(homeHtml: string): string[] {
  return parse(homeHtml)
    .querySelectorAll('article.edge-pl-item a.edge-pli-link')
    .map((link) => slugFromItemUrl(link.getAttribute('href') ?? ''))
    .filter((slug): slug is string => Boolean(slug));
}

/** Front-page grid columns at full width, e.g. 5 for "edge-pl-five-columns". */
export function parseGridColumns(homeHtml: string): number | undefined {
  const holder = parse(homeHtml).querySelector('.edge-portfolio-list-holder');
  const word = /edge-pl-(\w+)-columns/.exec(holder?.getAttribute('class') ?? '')?.[1];
  return word ? COLUMN_WORDS[word] : undefined;
}

/** Category slugs in filter-bar order. */
export function parseFilterOrder(homeHtml: string): string[] {
  return parse(homeHtml)
    .querySelectorAll('[data-filter]')
    .map((el) => /portfolio-category-([\w-]+)/.exec(el.getAttribute('data-filter') ?? '')?.[1])
    .filter((slug): slug is string => Boolean(slug));
}

export function parseItemPage(html: string): LegacyItemPage | undefined {
  const root = parse(html);
  const holderClass = root.querySelector('.edge-portfolio-single-holder')?.getAttribute('class');
  const layout = /edge-ps-(small-masonry|small-images|gallery)-layout/.exec(holderClass ?? '')?.[1];
  if (!layout) return undefined;

  const imageHolderClass = root.querySelector('.edge-ps-image-holder')?.getAttribute('class') ?? '';
  const columnWord = /edge-ps-(\w+)-columns/.exec(imageHolderClass)?.[1];

  const images = root
    .querySelectorAll('.edge-ps-image')
    .map((el) => ({
      img: el.querySelector('img'),
      large: el.classList.contains('edge-ps-masonry-large-item'),
    }))
    .map(({ img, large }) => ({ file: fileName(img?.getAttribute('src') ?? ''), large }))
    // Empty slots (an <img> with no src, or a video's wrapper) aren't images.
    .filter(({ file }) => file);

  const youtubeIds = [
    ...new Set(
      root
        .querySelectorAll('iframe')
        .map(
          (frame) => /youtube\.com\/embed\/([\w-]{11})/.exec(frame.getAttribute('src') ?? '')?.[1],
        )
        .filter((id): id is string => Boolean(id)),
    ),
  ];

  return {
    layout: layout as LegacyItemPage['layout'],
    columns: columnWord ? COLUMN_WORDS[columnWord] : undefined,
    images,
    youtubeIds,
  };
}

function slugFromItemUrl(url: string): string | undefined {
  return /portfolio-item\/([\w-]+)/.exec(url)?.[1];
}

function fileName(url: string): string {
  return url.split('/').pop() ?? '';
}
