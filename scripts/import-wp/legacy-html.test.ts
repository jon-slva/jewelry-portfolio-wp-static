import { describe, expect, it } from 'vitest';
import {
  parseFilterOrder,
  parseGridColumns,
  parseGridOrder,
  parseItemPage,
} from './legacy-html.ts';

const home = `
  <div class="edge-pl-filter-holder">
    <span data-filter="">Show all</span>
    <span data-filter=".portfolio-category-art">Art</span>
    <span data-filter=".portfolio-category-fine">Fine</span>
  </div>
  <div class="edge-portfolio-list-holder edge-pl-gallery edge-pl-five-columns">
    <div class="edge-pl-inner">
      <article class="edge-pl-item"><a class="edge-pli-link" href="./portfolio-item/b-ring/"></a></article>
      <article class="edge-pl-item"><a class="edge-pli-link" href="./portfolio-item/a-ring/"></a></article>
    </div>
  </div>`;

describe('home page', () => {
  it('reads the grid order', () => {
    expect(parseGridOrder(home)).toEqual(['b-ring', 'a-ring']);
  });

  it('reads the column count', () => {
    expect(parseGridColumns(home)).toBe(5);
  });

  it('reads the filter bar order', () => {
    expect(parseFilterOrder(home)).toEqual(['art', 'fine']);
  });
});

describe('parseItemPage', () => {
  it('reads layout, columns, image sizes and videos', () => {
    const html = `
      <div class="edge-portfolio-single-holder edge-ps-small-masonry-layout">
        <div class="edge-ps-image-holder edge-ps-masonry-images edge-ps-two-columns">
          <div class="edge-ps-image edge-ps-masonry-large-item"><img src="../../wp-content/uploads/Big.jpg"></div>
          <div class="edge-ps-image"><img src="../../wp-content/uploads/small.png"></div>
          <div class="edge-ps-image"><img src=""></div>
          <div class="edge-ps-image"><iframe src="https://www.youtube.com/embed/r0O95MqK2jQ?wmode=transparent"></iframe></div>
        </div>
      </div>`;

    expect(parseItemPage(html)).toEqual({
      layout: 'small-masonry',
      columns: 2,
      images: [
        { file: 'Big.jpg', large: true },
        { file: 'small.png', large: false },
      ],
      youtubeIds: ['r0O95MqK2jQ'],
    });
  });

  it('returns undefined for a page without a portfolio layout', () => {
    expect(parseItemPage('<p>Not an item</p>')).toBeUndefined();
  });
});
