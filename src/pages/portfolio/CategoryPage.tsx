import { data } from 'react-router';
import { categories } from '../../content';
import site from '../../content/site.json';
import { pageMeta } from '../../seo.ts';
import type { Route } from './+types/CategoryPage';
import { loadPortfolio } from './portfolio.data.ts';
import PortfolioView from './PortfolioView';

// /portfolio-category/<slug>/: the grid filtered to one category.
export function loader({ params }: Route.LoaderArgs) {
  const category = categories.find((term) => term.slug === params.slug);
  const portfolio = loadPortfolio({ category: params.slug });
  if (!category || portfolio.tiles.length === 0) throw data(null, { status: 404 });
  return { ...portfolio, category };
}

export function meta({ loaderData }: Route.MetaArgs) {
  if (!loaderData) return [{ title: `Not found – ${site.title}` }];
  const { category, tiles } = loaderData;
  return pageMeta({
    title: category.name,
    description: `${category.name}: ${tiles.length} pieces from the portfolio of CAD/CAM designer Jonathan Silva.`,
    path: `/portfolio-category/${category.slug}/`,
    image: tiles[0]?.cover,
  });
}

export default function CategoryPage({ loaderData }: Route.ComponentProps) {
  return <PortfolioView data={loaderData} activeCategory={loaderData.category.slug} />;
}
