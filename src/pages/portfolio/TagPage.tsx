import { data } from 'react-router';
import { tags } from '../../content';
import site from '../../content/site.json';
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
  return [{ title: `${loaderData.tag.name} – ${site.title}` }];
}

export default function TagPage({ loaderData }: Route.ComponentProps) {
  return <PortfolioView data={loaderData} intro={`Tagged “${loaderData.tag.name}”`} noneActive />;
}
