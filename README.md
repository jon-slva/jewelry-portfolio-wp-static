# Jewelry by Jonathan Silva

Portfolio site for Jonathan Silva – CAD/CAM director, designer and 3D sculptor.

A fully static React site (no database, no server) hosted on GitHub Pages. Content lives in plain
files under `src/content/`. A local admin for editing it is planned (see [docs/PLAN.md](docs/PLAN.md)).

> 🚧 Work in progress – the site is being rebuilt from the old WordPress version. Progress is tracked
> in [docs/PLAN.md](docs/PLAN.md).

## Requirements

- [Node.js](https://nodejs.org/) 24 (the version is pinned in `.nvmrc`)
- npm (comes with Node)

If you use [nvm](https://github.com/nvm-sh/nvm), run `nvm use` in the project folder to switch to
the right Node version.

## Getting started

```bash
npm install     # first time only, or after pulling new dependencies
npm run dev     # start the local site at http://localhost:5173
```

The dev server reloads automatically when you save a file.

## Scripts

| Command             | What it does                                                    |
| ------------------- | --------------------------------------------------------------- |
| `npm run dev`       | Run the site locally with live reload                           |
| `npm run build`     | Build the static site into `build/client/`                      |
| `npm run preview`   | Serve the last build locally, to check it before deploying      |
| `npm run typecheck` | Check TypeScript types                                          |
| `npm run lint`      | Check code for common mistakes (ESLint)                         |
| `npm run format`    | Auto-format code (Prettier)                                     |
| `npm test`          | Run the unit tests once (`npm run test:watch` to keep watching) |

<!-- TODO(phase 1e): deploy instructions. TODO(phase 2): admin instructions. -->

## Project layout

```
src/
  root.tsx           HTML shell, fonts, error page
  routes.ts          URL → page mapping (keeps the old WordPress URLs)
  pages/             one folder per page
  components/        shared building blocks (site layout, 404, …)
  styles/            global styles and design variables (_variables.scss)
  content/           all site content: text, settings and images
config/              build settings shared by Vite and React Router
docs/                plan and reference screenshots of the old site
legacy/wp-export/    old WordPress static export, used for the content import (removed at launch)
```

For how the less obvious pieces work (pre-rendering, hydration, generated route types, the base
path and so on), see [docs/concepts.md](docs/concepts.md).

## Styling

Each component has its own `*.module.scss` file next to it. Colors, fonts, spacing and breakpoints
are defined once in `src/styles/_variables.scss` – change them there to restyle the whole site.
