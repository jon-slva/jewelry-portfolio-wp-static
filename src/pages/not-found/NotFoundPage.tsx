import NotFound from '../../components/NotFound/NotFound';
import site from '../../content/site.json';

export function meta() {
  return [{ title: `Page not found – ${site.title}` }];
}

export default function NotFoundPage() {
  return <NotFound />;
}
