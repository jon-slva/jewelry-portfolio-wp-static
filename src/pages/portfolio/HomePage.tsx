import site from '../../content/site.json';
import { pageMeta } from '../../seo.ts';
import type { Route } from './+types/HomePage';
import { loadPortfolio } from './portfolio.data.ts';
import PortfolioView from './PortfolioView';

export function loader() {
  return loadPortfolio();
}

export function meta({ loaderData }: Route.MetaArgs) {
  return pageMeta({
    description: `${site.tagline}: fine jewelry, entertainment pieces and sculpture.`,
    path: '/',
    image: loaderData?.tiles[0]?.cover,
  });
}

export default function HomePage({ loaderData }: Route.ComponentProps) {
  return <PortfolioView data={loaderData} />;
}
