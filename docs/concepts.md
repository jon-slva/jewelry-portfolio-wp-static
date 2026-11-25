# Concepts behind this project

Short explainers for the techniques this project uses beyond the basics of pages, components and
styles. A new section is added as each part of the site is built, with pointers to where the idea
shows up in the code.

- [Check-in 1: project setup and site shell](#check-in-1-project-setup-and-site-shell)
- [Check-in 2: content files, import and validation](#check-in-2-content-files-import-and-validation)

---

## Check-in 1: project setup and site shell

### Static pre-rendering (why there is no server)

There are three common ways to deliver a React site:

| Approach                       | What the browser first receives                        | Needs a server? |
| ------------------------------ | ------------------------------------------------------ | --------------- |
| SPA (single-page app)          | An empty HTML page; JavaScript builds the page         | No              |
| SSR (server-side rendering)    | Full HTML, rendered by a server on every request       | Yes             |
| Pre-rendering (static / SSG)   | Full HTML, rendered **once at build time** into files  | No              |

GitHub Pages can only serve files, so this site is pre-rendered. In `react-router.config.ts`,
`ssr: false` turns off the server and `prerender: [...]` lists the URLs to render at build time.
`npm run build` then writes real files:

```
build/client/index.html              →  /
build/client/resume/index.html       →  /resume/
build/client/contact-me/index.html   →  /contact-me/
build/client/__spa-fallback.html     →  any URL that wasn't pre-rendered
```

Because `/resume/` is an actual file, deep links and page refreshes work on a plain file host. Search
engines and link previews (LinkedIn, iMessage, Slack) see the real content without running any
JavaScript. Every portfolio item page will be pre-rendered too (step 1e).

### Hydration

Pre-rendered HTML is static: the menu button doesn't do anything until JavaScript loads. When it
does, React **hydrates** the page. It walks the existing HTML and attaches event handlers to it,
instead of throwing it away and rebuilding it. From then on it is a normal React app, and clicking a
link swaps the page in the browser without a full reload.

The rule hydration brings: **the first render in the browser must produce the same HTML as the
build did**. Anything that differs between build time and view time (the current date, `window`,
random numbers) causes a "hydration mismatch". Example in this project: the copyright year in
`SiteLayout.tsx` is rendered at build time. After New Year, the browser would compute a different
year than the HTML file contains, so that one `<span>` has `suppressHydrationWarning`, and the year
updates whenever the site is rebuilt.

### What a static host can and can't do

"Static" means the host returns files exactly as they are. Nothing runs on the server for each
request. Images, PDFs, videos, fonts, HTML, CSS and JS are all just files, and that's what GitHub
Pages serves best. It serves them over HTTPS from a CDN (servers around the world), compressed and
with the correct file type, so a browser opens a PDF in its viewer and shows an image as usual.

What it can't do is anything that needs code running on the server, so this project handles those
another way:

| Needs a server                              | Handled here by                                            |
| ------------------------------------------- | ---------------------------------------------------------- |
| Rendering pages from a database             | Pre-rendering every page at build time                     |
| Resizing images on request                  | Generating each size at build time (step 1c)               |
| Receiving the contact form                  | A form service (Web3Forms) that emails you (step 1d)       |
| Redirecting old URLs (301)                  | Small HTML pages that forward to the new URL (step 1e)     |
| Editing content (WordPress admin)           | The local-only admin, which writes files you then deploy   |

GitHub's published limits for Pages are about 1 GB per published site and a soft 100 GB of traffic
per month. The original images total roughly 140 MB, and the resized copies are smaller, so the
site fits comfortably.

### What a visitor's browser downloads

Not the whole site. Every image, page and script is a separate file with its own URL, and the
browser asks for each one only when a page needs it:

- **The first page visited**: that page's HTML file, the CSS, and the JavaScript for React and the
  router. That's about 110 KB compressed, downloaded once and then cached. Each page's own code
  adds less than 1 KB.
- **Clicking to another page**: just that page's small code file and its images. The rest is
  already cached.
- **Images**: an `<img>` only downloads its own file, and only when it's on the page being viewed.
  The item page for one ring never downloads another ring's images. Lazy loading (step 1c) goes
  further: an image downloads only when it's about to scroll into view. Responsive sizes (`srcset`)
  let a phone fetch a 400 px wide WebP instead of a full-size original. Originals stay in the repo
  as the source for those sizes, and visitors get the resized copies.
- **Memory**: the browser keeps only the images on the current page decoded in memory, and frees
  them when it needs to. Downloaded files are cached on disk, which is what makes a return visit
  fast.

Where the images are hosted doesn't change any of this. An image on GitHub Pages and an image on
an image CDN are both one URL, fetched the same way. What matters to visitors is how big each file
is and when it loads, and that's what step 1c is about.

### Route modules: `meta`, `links`, `Layout`, `ErrorBoundary`

Every file listed in `src/routes.ts` is a **route module**. The default export is the page
component. Named exports are hooks that React Router calls for that page:

- **`meta`**: returns the page's `<title>` and `<meta>` tags. `<Meta />` in `src/root.tsx` writes
  them into `<head>`, and because pages are pre-rendered they end up in the HTML file. Item pages
  receive the URL's `params`, so each one can build its own title, description and share image
  (Open Graph tags, step 1e). A page's `meta` **replaces** the tags from parent routes rather than
  adding to them, so tags every page needs will come from a shared helper.
- **`links`**: returns `<link>` tags. `root.tsx` uses it for the Google Fonts stylesheet plus two
  `preconnect` hints, which open the connection to the font server early so the font arrives
  sooner.
- **`Layout`** (root only): the HTML document itself (`<html>`, `<head>`, `<body>`).
- **`ErrorBoundary`**: rendered instead of the page when something throws. A 404 shows the
  "Page not found" component. Any other error shows a generic message, with the details only in
  development: `import.meta.env.DEV` is replaced with `false` in the production build, so that
  branch is removed from the shipped code entirely.

More exports appear later, such as loading an item's data for its page (step 1d).

### Generated route types (`./+types/ItemPage`)

`ItemPage.tsx` imports `type { Route } from './+types/ItemPage'`, but there is no `+types` folder
next to it. React Router **generates** those types from `src/routes.ts` into `.react-router/types/`
(gitignored). The `rootDirs` setting in `tsconfig.json` tells TypeScript to treat that folder as if
it were overlaid on the project, so the relative import resolves.

The payoff: because the route is `portfolio-item/:slug`, TypeScript knows `params.slug` is a string.
Rename `:slug` in `routes.ts` and every page that still uses the old name shows a type error. The
dev server regenerates these types automatically, and `npm run typecheck` runs the generator first.

### TypeScript settings worth knowing

- **`import type`** (`verbatimModuleSyntax`): imports used only as types must say so. The build tool
  then drops them without having to analyze anything. ESLint can add the keyword for you
  (`npm run lint -- --fix`).
- **`erasableSyntaxOnly`**: forbids the few TypeScript features that generate JavaScript (`enum`,
  `namespace`, constructor parameter properties). Every `.ts` file stays "JavaScript plus types":
  delete the types and it runs. That's what lets Node 24 run the import scripts' `.ts` files
  directly (step 1b). Use a union instead of an enum: `type LayoutType = 'masonry' | 'stacked'`.
- **`satisfies`** (in `routes.ts` and `react-router.config.ts`): checks that a value matches a type,
  without changing the value's own, more precise type. A typo in a config key is still an error.

### Base path: project URL vs custom domain

While the site is being built, previews live at `https://jon-slva.github.io/jewelry-portfolio-wp-static/`,
which is a subfolder. Every asset URL and link needs that prefix. After launch on jewelrybyjs.com, the
prefix is just `/`.

One environment variable, `BASE_PATH`, handles both. `config/basePath.ts` normalizes it, and it
feeds Vite's `base` (asset URLs) and React Router's `basename` (links). Code always writes links as
`/resume/`, and the prefix is added automatically. One side effect, handled in step 1e: with a
prefix, React Router writes pages into `build/client/<prefix>/`, which the deploy step flattens.

### Assets imported from code

- `import logo from '…/logo.png'` gives a URL string. Vite copies the file into the build with a
  **content hash** in its name (`logo-yKENk5n2.png`). The name changes only when the file changes,
  so browsers can cache it forever and still never show a stale version ("cache busting"). JS and
  CSS files get the same treatment.
- **Code splitting**: each page gets its own JavaScript file (`HomePage-….js`, `ResumePage-….js`),
  loaded only when that page is visited.
- `import site from '…/site.json'` bundles the JSON as a plain object, and TypeScript infers its
  shape. The portfolio content files will work the same way (step 1b).

### Accessibility details in the site shell

- **Menu button** (`SiteLayout.tsx`): `aria-expanded` tells screen readers whether the menu is open,
  and `aria-controls` points at the menu it opens. The hamburger icon is `aria-hidden`. The button's
  name comes from a "Menu" label that is hidden visually but still read aloud (`.visuallyHidden`).
  `display: none` would hide it from screen readers too.
- **`<nav aria-label="Main">`** names the menu as the main navigation, so screen-reader users can jump
  to it.
- **`:focus-visible`** (`global.scss`): shows the yellow focus ring for keyboard users only, not on
  every mouse click.
- **`prefers-reduced-motion`**: if the visitor's OS asks for less motion, transitions are switched
  off.
- **`width` / `height` on `<img>`**: the browser reserves the right space before the image loads, so
  the page doesn't jump around ("layout shift").
- **`rel="noopener noreferrer"`** on links that open a new tab: the new tab can't control this page,
  and doesn't receive it as the referrer.

---

## Check-in 2: content files, import and validation

### Types vs. runtime validation (zod)

TypeScript types only exist while you're editing and type-checking. They're erased before the code
runs, so they can't check data that arrives from outside the code: a JSON file someone edited by
hand, or (later) a form in the admin. If `items/ring.json` says `"date": "21/07/2023"`, TypeScript
never sees it.

[zod](https://zod.dev) checks data **while the code runs**. `src/content/schema.ts` describes every
content file once as a zod schema, and the TypeScript types are generated from those schemas:

```ts
export const itemSchema = z.strictObject({ title: z.string().min(1), date: z.iso.date(), ... });
export type Item = z.infer<typeof itemSchema>; // { title: string; date: string; ... }
```

So the rules (`npm run validate`) and the types (the editor, `npm run typecheck`) come from the same
place and can't disagree. `strictObject` also rejects keys the schema doesn't know, which catches
typos like `"catgories"`.

### Discriminated unions

An item's `media` list mixes images and YouTube videos, and each entry says which it is with a
`type` field. A union keyed on a shared literal field like this is a **discriminated union**:

```ts
if (media.type === 'image') {
  media.file; // TypeScript knows this is an image here
} else {
  media.id; // ...and a YouTube video here
}
```

Checking `type` narrows the type automatically, without casts. `layout` works the same way: only
`masonry` and `gallery` have `columns`, so `stacked` can't accidentally get one.

### Running TypeScript directly in Node

The import and validation scripts are `.ts` files that Node 24 runs as they are
(`node scripts/validate/index.ts`), with no build step or extra tool. Node simply **strips the type
annotations** and runs what's left. That's why:

- `tsconfig.json` has `erasableSyntaxOnly`, which bans the few TypeScript features that can't just be
  stripped (`enum`, `namespace`, constructor parameter properties). The importer's `MediaFiles`
  class declares its fields normally for this reason.
- Imports include the extension (`./wxr.ts`), because Node doesn't guess file extensions.

### Logic separate from files on disk

Each script is split in two:

- **Pure logic** (`map-item.ts`, `map-site.ts`, `validate/rules.ts`) takes plain data and returns
  plain data. It never reads files.
- **A thin command** (`import-wp/index.ts`, `validate/index.ts`) reads the files, calls the logic and
  writes or prints the result.

That split is what makes the tests simple. `rules.test.ts` builds a tiny valid site in memory, breaks
one thing per test and checks the error, with no real files and no export needed.

### npm `pre` scripts

npm runs a script named `pre<name>` automatically before `<name>`. `package.json` has
`"prebuild": "npm run validate"`, so `npm run build` always checks the content first and stops if it
finds a mistake. A broken image path is caught on your machine, not discovered on the live site.

### File names and letter case

macOS ignores letter case in file names (`Hero.JPG` and `hero.jpg` are the same file), but Linux,
which build servers usually run on, doesn't. A path with the wrong case works locally and breaks
after deploying. So the importer lowercases every file name, the schema only accepts lowercase media
paths, and validation compares paths exactly rather than asking the file system.

### What WordPress stored, and how it was read

- **WXR** is WordPress's export format: one big XML file with every post, page, image and setting.
  `scripts/import-wp/wxr.ts` turns it into plain objects with
  [fast-xml-parser](https://github.com/NaturalIntelligence/fast-xml-parser).
- **Post meta** holds the theme's settings (layout, columns, gallery image IDs). Some values are
  stored in PHP's own `serialize()` format, like the YouTube videos. `php-unserialize.ts` is a small
  reader for it.
- **Shortcodes** like `[vc_row]` are page-builder markup that only WordPress understands.
  `content-text.ts` removes them and splits the text into title, subtitle, description, software and
  client.
- The **static HTML export** shows what the site actually rendered. The importer uses it for the
  front-page order, and to double-check layouts and image sizes against the XML.

### A guarded one-off script

The importer refuses to run when `src/content/items/` already has items, unless you pass `--force`.
Once content is edited by hand or in the admin, re-importing would silently throw those edits away,
so the script makes that a deliberate choice.
