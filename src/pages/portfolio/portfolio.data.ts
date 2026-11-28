import type { GridTile } from '../../components/PortfolioGrid/PortfolioGrid.types.ts';
import { categories, getImage, getVideo, grid, items } from '../../content';
import { filterItems, getGridItems, termsInUse, type ItemFilter } from '../../content/portfolio.ts';
import type { Item } from '../../content/schema.ts';

// Shared by the loaders of the home, category and tag pages. Runs at build
// time, so only the tiles a page shows end up in that page's data.

export function loadPortfolio(filter: ItemFilter = {}) {
  const published = getGridItems(items, grid);
  return {
    tiles: filterItems(published, filter).map(toTile),
    /** Categories with at least one published item, for the filter bar. */
    filterCategories: termsInUse(categories, published, 'categories'),
    columns: grid.columns,
    gap: grid.gap,
  };
}

export type PortfolioData = ReturnType<typeof loadPortfolio>;

function toTile(item: Item): GridTile {
  return {
    slug: item.slug,
    title: item.title,
    featured: item.featured,
    cover: getImage(item.cover),
    coverVideo: item.coverVideo ? getVideo(item.coverVideo) : undefined,
  };
}
