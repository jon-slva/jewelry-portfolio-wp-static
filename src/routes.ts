import { type RouteConfig, index, route } from '@react-router/dev/routes';

// URLs match the old WordPress site so existing links keep working.
export default [
  index('pages/home/HomePage.tsx'),
  route('portfolio-item/:slug', 'pages/item/ItemPage.tsx'),
  // TODO(phase 1d): /portfolio-category/:slug and /portfolio-tag/:slug filtered grids.
  route('resume', 'pages/resume/ResumePage.tsx'),
  route('contact-me', 'pages/contact/ContactPage.tsx'),
  route('*', 'pages/not-found/NotFoundPage.tsx'),
] satisfies RouteConfig;
