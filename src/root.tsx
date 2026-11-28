import type { PropsWithChildren } from 'react';
import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from 'react-router';
import type { Route } from './+types/root';
import NotFound from './components/NotFound/NotFound';
import SiteLayout from './components/SiteLayout/SiteLayout';
import site from './content/site.json';
import './styles/global.scss';

// Title for error pages and for the 404 fallback page (see HydrateFallback),
// none of which search engines should index. Pages that load normally set
// their own tags, which replace these.
export function meta({ error }: Route.MetaArgs) {
  const noindex = { name: 'robots', content: 'noindex' };
  if (isRouteErrorResponse(error) && error.status === 404) {
    return [{ title: `Page not found – ${site.title}` }, noindex];
  }
  return [{ title: error ? `Something went wrong – ${site.title}` : site.title }, noindex];
}

export const links: Route.LinksFunction = () => [
  // TODO(phase 1d): consider self-hosting Montserrat instead of Google Fonts.
  { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
  { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossOrigin: 'anonymous' },
  {
    rel: 'stylesheet',
    href: 'https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700&display=swap',
  },
];

/** The HTML document shell shared by every page. */
export function Layout({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return (
    <SiteLayout>
      <Outlet />
    </SiteLayout>
  );
}

/**
 * Shown for a URL that wasn't pre-rendered (e.g. a mistyped address) while
 * the browser loads the app and works out which page it is. Just the empty
 * frame, so the sidebar doesn't flash.
 */
export function HydrateFallback() {
  return <SiteLayout>{null}</SiteLayout>;
}

/** Shown when a page throws, e.g. an unknown portfolio item slug. */
export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  if (isRouteErrorResponse(error) && error.status === 404) {
    return (
      <SiteLayout>
        <NotFound />
      </SiteLayout>
    );
  }

  const message = error instanceof Error ? error.message : 'Unknown error';
  return (
    <SiteLayout>
      <h1>Something went wrong</h1>
      {import.meta.env.DEV && <pre>{message}</pre>}
    </SiteLayout>
  );
}
