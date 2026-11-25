import { type RouteConfig, index, route } from '@react-router/dev/routes';

// URLs match the old WordPress site so existing links keep working.
export default [
  index('pages/portfolio/HomePage.tsx'),
  route('portfolio-category/:slug', 'pages/portfolio/CategoryPage.tsx'),
  route('portfolio-tag/:slug', 'pages/portfolio/TagPage.tsx'),
  route('portfolio-item/:slug', 'pages/item/ItemPage.tsx'),
  route('resume', 'pages/resume/ResumePage.tsx'),
  route('contact-me', 'pages/contact/ContactPage.tsx'),
  route('*', 'pages/not-found/NotFoundPage.tsx'),
] satisfies RouteConfig;
