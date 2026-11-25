# Jewelry Portfolio — Rebuild Plan

Moving the WordPress (Anders theme) portfolio to a static React site on GitHub Pages, with a local-only
admin for managing content. Tick items off as they land.

## Decisions

| Topic | Decision |
|---|---|
| Hosting | GitHub Pages. Previews deploy to `jon-slva.github.io/jewelry-portfolio-wp-static/` while WordPress stays live. At launch: custom domain `jewelrybyjs.com` at base `/` |
| Base path | Build setting (`BASE_PATH`), default `/`; preview deploys use `/jewelry-portfolio-wp-static/` |
| Design | Recreate the Anders look (5-column overlay grid, filter bar, item layouts) with clean, hand-editable code |
| Contact | Web3Forms form, plus LinkedIn link |
| Demo content | Dropped: 2017 blog posts, team, testimonials, 95 draft items, About/Blog drafts |
| Styling | Sass + CSS modules (one `.module.scss` per component, shared variables in `src/styles/`) |
| Images | Originals kept in `src/content/media/`, resized to WebP + JPEG at build time with sharp. Admin uploads follow the same rule |
| Language | TypeScript throughout (site, admin, scripts), used where it adds value (see conventions below) |
| Tests | Vitest for data logic only: importer, validation, grid/filter logic, admin file operations. No component or snapshot tests |
| Node | 24 LTS (`.nvmrc`) |
| Repo hygiene | `_source/` (WXR, contains emails) and local tool files stay out of git |

## Content model (`src/content/`)

```
src/content/
  site.json                 # site title, description, contact + social links, resume PDF
  grid.json                 # front-page grid: order of items + grid settings (columns, gap)
  categories.json           # [{ slug, name }] in filter-bar order
  tags.json                 # [{ slug, name }]
  redirects.json            # [{ from, to }] old item slugs that forward to the current one
  items/<slug>.json         # one file per portfolio item
  media/<slug>/...          # original images for that item
  media/site/...            # logo, resume PDF, other shared files
```

Item file example:

```jsonc
{
  "title": "Reza Ruban Ring",
  "slug": "reza-ruban-ring",          // URL: /portfolio-item/reza-ruban-ring/
  "subtitle": "",
  "date": "2023-07-21",
  "draft": false,                      // true = hidden from the site, kept in the admin
  "featured": false,                   // true = larger tile on the front-page grid
  "categories": ["fine"],
  "tags": [],
  "description": "Plain text / simple HTML",
  "software": ["Rhinoceros 3D", "Matrix", "Vray", "Grasshopper"],
  "client": "Reza International Inc.",
  "cover": "media/reza-ruban-ring/ruban-thumb.jpg",   // grid thumbnail
  "layout": { "type": "masonry", "columns": 2 },       // per-item image layout (see below)
  "media": [                                            // gallery, in display order
    { "type": "image", "file": "media/reza-ruban-ring/hero.webp", "alt": "Reza Ruban Ring – hero view", "size": "large" },
    { "type": "youtube", "id": "e69zDtjp4b8", "title": "Crocodile necklace video", "size": "normal" }
  ]
}
```

**Videos.**
- Short silent clips (like the turnaround GIFs) are hosted with the site as looping MP4s: `{ "type": "video", "file": "….mp4", "poster": "….jpg", "alt": "…", "size": "normal" }`. An item can also have a `coverVideo` for its grid tile.
- Four items have YouTube videos in their galleries: crocodile-necklace, cosmea-diamond-ring, floating-octahedron-ring (that one has two), and vincent-castiglia-the-sleep-necklace.
- The old site shows them after the images, so they're imported at the end of `media`.
- They come from the theme's `edge_portfolio_images` meta and become `youtube` entries in `media`.
- On the site they show as a lightweight click-to-play thumbnail. The YouTube player only loads when clicked, which keeps pages fast.

**Per-item image layouts.** These carry over from what the Anders theme offered and what the current items use:

| `layout.type` | Anders name | Used by today | Options |
|---|---|---|---|
| `masonry` | small-masonry | 21 items | `columns` 2–3; each image `size`: `normal` or `large` (large spans 2 cells) |
| `stacked` | small-images (the theme default) | 5 items | images in a single column beside the text |
| `gallery` | gallery | 1 item (crocodile-necklace) | `columns` 2–4, uniform tiles |

**Front-page grid arrangement.**
- Item order lives in one file, `grid.json`, rather than an `order` number on each item. Reordering then rewrites one file, the order is easy to read and hand-edit, and new items get appended automatically.
- Grid settings (columns per breakpoint, gap) live in the same file. Imported from the theme: 5 / 3 / 2 / 1 tiles per row (over 1200px / 1025–1200 / 681–1024 / up to 680), 10px gap.
- `featured` items render as a double-size tile.
- All imported items start with `featured: false`, so the grid matches today's site.

## TypeScript conventions

Use TypeScript where it catches mistakes or documents a shape. Skip it where it only adds noise.

**Where types live**
- Types and interfaces go in `.ts` files and get imported with `import type`. `.tsx` files hold components and markup, not type declarations.
- Types for a page or component sit beside it in that folder, e.g. `src/pages/item/item.types.ts` or `src/components/PortfolioGrid/PortfolioGrid.types.ts`.
- Content types (item, media, category, tag, grid, site) are defined once as zod schemas in `src/content/schema.ts`, with the types inferred from them. Nothing redeclares those shapes by hand.
- Admin API request/response types sit with the admin code, so the dev-server plugin and the admin UI share them.

**When to write a type**
- Write types for:
  - component props
  - parameters of shared/exported functions
  - content data
  - anything crossing a boundary (JSON files, form input, the admin API)
- Let inference do the rest. No annotations on obvious locals, `useState` with a clear default, or component return types.

**Style rules**
- `interface` for props and object shapes. `type` for unions and zod-inferred types.
- String-literal unions instead of `enum`.
- No `any`. Use `unknown` at boundaries and narrow it with zod.
- No clever generics or nested utility types. Readable beats clever.

**Enforced by config, not by hand**
- `tsconfig`: `strict: true`. It's one flag that catches real bugs and adds no code.
- ESLint (`typescript-eslint` recommended set): enforces `import type` and flags `any`. The stricter preset is deliberately not used.
- Scripts (importer, validation, image build) are `.ts` files run directly by Node 24's built-in TypeScript support, so no extra runner package is needed.

## Testing approach

Unit tests cover the logic where a bug would be silent: content that quietly goes missing or comes out wrong without any error showing.
- **Importer:** shortcode stripping, splitting out Software/Client, layout and per-image size mapping, YouTube mapping, grid order. Tests use small fixture snippets, not the real `_source/` export.
- **Validation rules:** each rule has a passing and a failing case.
- **Grid and filter logic:** ordering from `grid.json`, category/tag filtering, drafts hidden.
- **Admin file operations:**
  - save and validate
  - rename a slug, which updates `grid.json` and media paths
  - delete a category or tag while it's in use
  - reorder

Not covered by unit tests: visual components, snapshots, and end-to-end browser tests. Those parts get checked by you at each check-in, against `docs/reference/`.

`npm test` runs the suite. `npm run deploy` runs validate → test → build first, and stops on any failure.

## Phase 0 — Plan & reference (`feature/project-plan`)

- [x] Create `develop` from `main` and push it
- [x] `.gitignore`: `_source/`, `node_modules/`, `dist/`, image cache, local editor/tool files
- [x] This plan (`docs/PLAN.md`)
- [x] Full-page reference screenshots of jewelrybyjs.com into `docs/reference/` (see its README):
  - Pages: home (all + one filtered view + tile hover), resume, contact, 404
  - Items, one per layout:
    - `reza-ruban-ring` (masonry)
    - `wall-e-necklace` (stacked)
    - `crocodile-necklace` (gallery + video)
    - `reza-spirale-ring` (GIFs)
  - Each at desktop and mobile width
- [x] ✅ Check-in → commit → push for review

## Phase 1 — Core site (`feature/core-site`)

### 1a. Scaffold
- [x] Vite + React 19 + TypeScript + React Router 8 (pre-rendered static routes)
- [x] Sass modules, ESLint + Prettier, Vitest, `.nvmrc`
- [x] Configurable base path (`BASE_PATH`)
- [x] Move the Simply Static export into `legacy/wp-export/`. It stays there as an importer source and is deleted at launch.
- [x] ✅ Check-in 1: app runs locally (`npm run dev`)

### 1b. Content model, importer, validation
- [x] Types + zod schema for site, grid, categories, tags, items
- [x] `scripts/import-wp/`:
  - [x] Read the WXR XML first. Published `portfolio-item`s only.
  - [x] Fall back to the Simply Static HTML for anything missing, and for the exact front-page order (WordPress `menu_order` has ties)
  - [x] Strip Visual Composer shortcodes. Split out title / subtitle / description / Software / Client.
  - [x] Map layouts: template, columns, and per-image large/normal size
  - [x] Map YouTube videos from `edge_portfolio_images` into `media`, in their original positions
  - [x] Copy originals only (`-scaled` where WordPress downscaled them). Skip generated size variants (`-300x225`, etc.).
  - [x] Generate starter alt text ("<Title> – view N"), editable later
  - [x] Collect old slugs (`_wp_old_slug`) into `redirects.json`, skipping post-copy leftovers
  - [x] Write `docs/migration-report.md`:
    - unmapped fields
    - missing files (26 old attachments of real items, 438 orphaned demo files)
    - shortcode before/after samples
- [x] `npm run validate` fails the build on:
  - broken image refs
  - unknown categories or tags
  - duplicate slugs
  - items missing from `grid.json`, or entries in it with no item
  - redirects that clash with an item or point nowhere
  - (runs automatically before `npm run build`)
- [x] Vitest tests for the importer, validation and grid/filter logic (see Testing approach)
- [x] ✅ Check-in 2: review the generated content files + migration report

### 1c. Image pipeline
- [x] sharp build step (`npm run images`): WebP at 400 / 800 / 1200 / 1920 px plus one 1200 px JPEG fallback, cached by file hash, git-ignored. Runs before dev and build.
- [x] Turnaround GIFs (13–15 MB) → looping MP4 (H.264, CRF 26): 2.5 MB on the item page, 0.75 MB for the grid tile. Animated WebP was only 15–40% smaller, so videos won after a side-by-side comparison. New `video` media type and optional `coverVideo`; `npm run gif-to-video` for future GIFs
- [x] `<LoopVideo>` component: lazy-loads and plays only when on screen, poster first, controls instead of autoplay for reduced motion
- [x] Temporary home page: every item's cover in `grid.json` order, linking to its page (replaced by the real grid in 1d)
- [x] `<Picture>` component: `srcset`/`sizes`, lazy loading, width/height to avoid layout shift, main color while loading
- [x] Item pages pre-rendered from content, data loaded at build time (temporary single-column view until 1d)

### 1d. Public pages
- [ ] Header / nav / footer matching the Anders look
- [ ] Front-page grid:
  - order and settings from `grid.json`
  - overlay hover
  - featured tiles
- [ ] Filters:
  - category filter bar and tag filtering, driven by data
  - reflected in the URL so filtered views can be linked
- [ ] Item page:
  - text block, Software / Client, categories, tags
  - images and videos in the item's chosen layout (masonry / stacked / gallery)
  - lightbox
  - click-to-play YouTube embeds
- [ ] `/portfolio-category/<slug>/` and `/portfolio-tag/<slug>/` pages (filtered grid), so old links keep working
- [ ] Resume (PDF link + preview image), Contact (Web3Forms), 404
- [ ] Responsive + accessible: keyboard filters, focus states, alt text, reduced-motion
- [ ] ✅ Check-in 3: click through the whole site locally

### 1e. SEO & deploy
- [ ] Pre-render every route with trailing slashes. GitHub Pages then serves real HTML files, so deep links and refresh work without the SPA redirect hack. `404.html` covers unknown URLs.
- [ ] Per-page `<title>`, description, canonical, Open Graph / Twitter image per item
- [ ] `sitemap.xml` + `robots.txt` generated from content
- [ ] `npm run deploy` (validate → test → build → gh-pages) → preview at the project URL
- [ ] README: install, run, build, validate, deploy
- [ ] ✅ Check-in 4 → branch complete → push for review

## Phase 2 — Local admin (`feature/admin`)

- [ ] Vite dev-server plugin (`apply: 'serve'`):
  - local JSON API that reads and writes `src/content/`
  - not present in production builds; a build check fails if admin code leaks in
- [ ] `/admin` dashboard (dev only):
  - [ ] **Front-page grid:** drag-and-drop to reorder tiles (writes `grid.json`), toggle `featured`, adjust columns and gap
  - [ ] **Items:** create, edit, delete, toggle draft
  - [ ] **Item editor:**
    - text fields, Software / Client
    - categories and tags: pick from the existing lists or create new ones inline
    - **layout picker:** masonry / stacked / gallery, plus columns
  - [ ] **Images and videos:**
    - drag-and-drop upload (originals saved to `media/<slug>/`)
    - add a YouTube video by pasting its URL
    - drag to reorder images and videos together
    - alt text
    - per-image large/normal size (masonry)
    - choose the cover
    - remove
  - [ ] **Live preview:** renders the real item page component beside the form
  - [ ] **Categories & tags manager:** add, rename, reorder the filter bar, delete (warns when the term is in use)
  - [ ] Validation runs on every save, with errors shown inline
- [ ] Tests for the content read/write logic
- [ ] README: how to use the admin
- [ ] ✅ Check-ins as features land → push for review

## Phase 3 — Launch (`feature/launch`)

- [ ] Side-by-side check against `docs/reference/` and the live site (content, order, filters, layouts)
- [ ] Redirect pages for old slugs of real items (from `_wp_old_slug`)
- [ ] Remove `legacy/wp-export/` and the old `package.json` scripts
- [ ] Build with base `/`, add `CNAME` (`jewelrybyjs.com`)
- [ ] README: DNS steps (A/AAAA records + `www` CNAME), the GitHub Pages custom domain setting and HTTPS
- [ ] Checklist for after the DNS switch: verify the site and HTTPS, submit the sitemap, then shut down WordPress
- [ ] ✅ Check-in → push for review

## Later / nice-to-have

- [ ] TODO: per-item tile size beyond `featured` (e.g. wide/tall tiles), if wanted
- [ ] TODO: decide whether to download any of the 26 unused old attachments before WordPress goes away
