import site from '../../content/site.json';
import type { Route } from './+types/HomePage';
import { loadPortfolio } from './portfolio.data.ts';
import PortfolioView from './PortfolioView';

export function loader() {
  return loadPortfolio();
}

export function meta() {
  return [
    { title: `${site.title} – ${site.tagline}` },
    { name: 'description', content: site.tagline },
  ];
}

export default function HomePage({ loaderData }: Route.ComponentProps) {
  return <PortfolioView data={loaderData} />;
}
