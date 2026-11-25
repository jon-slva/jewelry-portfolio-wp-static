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

The dev server reloads automatically when you save a file. Before starting, it builds the web
versions of the images (see [Images](#images)). The very first time that takes about 15 seconds.

## Scripts

| Command                | What it does                                                                   |
| ---------------------- | ------------------------------------------------------------------------------ |
| `npm run dev`          | Run the site locally with live reload                                          |
| `npm run build`        | Check the content, then build the static site into `build/client/`             |
| `npm run preview`      | Serve the last build locally, to check it before deploying                     |
| `npm run images`       | Build web-sized copies of the content images (runs before dev and build)       |
| `npm run gif-to-video` | Turn an animated GIF into a much smaller looping video (see [Images](#images)) |
| `npm run validate`     | Check the content files for mistakes (see [Content](#content))                 |
| `npm run import:wp`    | One-off import from the old WordPress site (see below)                         |
| `npm run typecheck`    | Check TypeScript types                                                         |
| `npm run lint`         | Check code for common mistakes (ESLint)                                        |
| `npm run format`       | Auto-format code (Prettier)                                                    |
| `npm test`             | Run the unit tests once (`npm run test:watch` to keep watching)                |

<!-- TODO(phase 1e): deploy instructions. TODO(phase 2): admin instructions. -->

## Project layout

```
src/
  root.tsx           HTML shell, fonts, error page
  routes.ts          URL → page mapping (keeps the old WordPress URLs)
  pages/             one folder per page
  components/        shared building blocks (site layout, 404, …)
  styles/            global styles and design variables (_variables.scss)
  content/           all site content: text, settings and images (see Content below)
scripts/
  import-wp/         one-off WordPress import
  validate/          content checks (npm run validate)
  images/            web image and video build (npm run images)
  gif-to-video/      GIF → MP4 conversion (npm run gif-to-video)
config/              build settings shared by Vite and React Router
docs/                plan, migration report, concepts, reference screenshots of the old site
legacy/wp-export/    old WordPress static export, used for the content import (removed at launch)
```

For how the less obvious pieces work (pre-rendering, hydration, generated route types, the base
path and so on), see [docs/concepts.md](docs/concepts.md).

## Content

Everything the site shows lives in `src/content/` as plain JSON files and images:

```
src/content/
  site.json            title, tagline, logo, social links, resume PDF
  grid.json            front-page order of the items, plus tiles per row and spacing
  categories.json      categories, in filter-bar order
  tags.json            tags
  redirects.json       old item URLs that forward to the current one
  items/<slug>.json    one file per portfolio item (its URL is /portfolio-item/<slug>/)
  media/<slug>/        that item's original images
  media/site/          logo, resume PDF and other shared files
  schema.ts            the rules every file above must follow
```

Until the admin exists, edit these files directly. A few things to know:

- **New item**: add `items/<slug>.json` (copy an existing one), put its images in `media/<slug>/`,
  and add the slug to `items` in `grid.json` where it should appear.
- **Draft**: set `"draft": true` to hide an item from the site without deleting it.
- **Layout**: `"layout"` is `{ "type": "masonry", "columns": 2 }` (2–3 columns),
  `{ "type": "gallery", "columns": 3 }` (2–4) or `{ "type": "stacked" }`. In masonry, an image with
  `"size": "large"` takes up two cells.
- **File names** must be lowercase (`hero-shot.jpg`, not `Hero-Shot.JPG`).

Run `npm run validate` after editing. It lists any mistakes: a misspelled field, a missing image, an
unknown category or tag, an item missing from `grid.json`. The build runs the same check and stops
if anything is wrong.

### Importing from WordPress

The content was imported once from the old WordPress site with `npm run import:wp`. It needs the
WordPress export file in `_source/` (kept out of git) and the static export in `legacy/wp-export/`.
It writes the content files, copies the images and writes
[docs/migration-report.md](docs/migration-report.md), which lists everything changed or left
behind. Running it again would overwrite later edits, so it refuses unless you add `-- --force`.

## Images

Keep only the **original, full-size** images in `src/content/media/`. `npm run images` turns each
image the content uses into WebP files at several widths plus a JPEG fallback, in `public/img/`.
Pages then serve the smallest file that looks sharp on each screen, and only load images as they
scroll into view.

- It runs automatically before `npm run dev` and `npm run build`. Run it yourself after adding or
  replacing an image while the dev server is running.
- Unchanged images are skipped, so only new or edited ones take time.
- `public/img/` and `src/generated/` are generated and git-ignored. Delete them to force a full
  rebuild.

### Animated GIFs → video

GIFs are huge (the two turnarounds were 13 and 15 MB). A short silent MP4 that loops looks the same
at a fraction of the size (0.75 and 2.5 MB). To convert one (needs [ffmpeg](https://ffmpeg.org/):
`brew install ffmpeg`):

```bash
npm run gif-to-video -- media/<slug>/<name>.gif               # full size, for an item page
npm run gif-to-video -- media/<slug>/<name>.gif --width 400   # smaller, for a grid tile
```

It writes `<name>.mp4` and a still `<name>-poster.jpg` next to the GIF and prints the entry to use in
the item file:

```json
{
  "type": "video",
  "file": "media/<slug>/<name>.mp4",
  "poster": "media/<slug>/<name>-poster.jpg",
  "alt": "…",
  "size": "normal"
}
```

For a grid tile, set the item's `"coverVideo"` to the video and `"cover"` to the poster. Then delete
the GIF. On the site, videos play muted and looping like a GIF, only download when scrolled into
view, and show the poster with play controls to visitors who have reduced motion turned on.

## Styling

Each component has its own `*.module.scss` file next to it. Colors, fonts, spacing and breakpoints
are defined once in `src/styles/_variables.scss` – change them there to restyle the whole site.
