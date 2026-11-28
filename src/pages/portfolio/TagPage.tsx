import { data } from 'react-router';
import { tags } from '../../content';
import site from '../../content/site.json';
import { pageMeta } from '../../seo.ts';
import type { Route } from './+types/TagPage';
import { loadPortfolio } from './portfolio.data.ts';
import PortfolioView from './PortfolioView';

// /portfolio-tag/<slug>/: the grid filtered to one tag (linked from item pages).
export function loader({ params }: Route.LoaderArgs) {
  const tag = tags.find((term) => term.slug === params.slug);
  const portfolio = loadPortfolio({ tag: params.slug });
  if (!tag || portfolio.tiles.length === 0) throw data(null, { status: 404 });
  return { ...portfolio, tag };
}

export function meta({ loaderData }: Route.MetaArgs) {
  if (!loaderData) return [{ title: `Not found – ${site.title}` }];
  const { tag, tiles } = loaderData;
  return pageMeta({
    title: tag.name,
    description: `Pieces tagged “${tag.name}” from the portfolio of CAD/CAM designer Jonathan Silva.`,
    path: `/portfolio-tag/${tag.slug}/`,
    image: tiles[0]?.cover,
  });
}

export default function TagPage({ loaderData }: Route.ComponentProps) {
  return <PortfolioView data={loaderData} intro={`Tagged “${loaderData.tag.name}”`} noneActive />;
}
