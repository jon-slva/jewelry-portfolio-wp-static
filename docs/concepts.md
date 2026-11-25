# Concepts behind this project

Short explainers for the techniques this project uses beyond the basics of pages, components and
styles. A new section is added as each step of [the plan](PLAN.md) is built, with pointers to where
the idea shows up in the code.

- [Step 1a: project setup and site shell](#step-1a-project-setup-and-site-shell)
- [Step 1b: content files, import and validation](#step-1b-content-files-import-and-validation)
- [Step 1c: responsive images](#step-1c-responsive-images)
- [Step 1d: portfolio grid and filters](#step-1d-portfolio-grid-and-filters)

---

## Step 1a: project setup and site shell

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

## Step 1b: content files, import and validation

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

---

## Step 1c: responsive images

### Build-time image processing

Browsers can't resize images, and the originals are far too big to send (a 3300 px, 2.9 MB PNG for
an image shown 900 px wide). So `npm run images` (`scripts/images/`) uses
[sharp](https://sharp.pixelplumbing.com/) to make web-ready copies of every image the content uses:

- WebP at 400, 800, 1200 and 1920 px wide (never larger than the original). WebP is about a third
  smaller than JPEG at the same quality.
- One JPEG at 1200 px, for the rare browser without WebP.
- Camera rotation applied and camera metadata (including location) removed.

The copies go to `public/img/`, and a list of them with each image's size and main color goes to
`src/generated/media.json`. Both are git-ignored, because they can always be rebuilt from the
originals. That's the general rule: commit sources, not build output.

**Caching by fingerprint.** Each original's contents are hashed (SHA-1). If the hash matches the
last run and the files are still there, the image is skipped. The first run takes about 15 seconds;
after that it's instant, and editing one image rebuilds only that one. `npm run dev` and
`npm run build` run it first automatically (`predev` / `prebuild`).

### `srcset` and `sizes`: letting the browser choose

`<Picture>` (`src/components/Picture/`) renders:

```html
<picture>
  <source type="image/webp"
          srcset="img/ring/1-400.webp 400w, img/ring/1-800.webp 800w, img/ring/1-1200.webp 1200w, ..."
          sizes="(min-width: 1024px) min(900px, calc(100vw - 423px)), calc(100vw - 32px)">
  <img src="img/ring/1.jpg" width="3300" height="2550" alt="..." loading="lazy" decoding="async">
</picture>
```

- **`srcset`** lists the files and their real widths.
- **`sizes`** tells the browser how wide the image will be **displayed**, before the CSS has even
  loaded. The browser multiplies that by the screen's pixel density and picks the smallest file
  that's big enough. A phone showing the image 360 px wide on a 3× screen picks the 1200 px file; a
  laptop showing it 880 px wide on a 2× screen picks 1920.
- **`<source type="image/webp">`** is skipped by browsers that can't show WebP, which fall back to
  the `<img>` JPEG.

Getting `sizes` right matters: if it says `100vw` for an image that's really a 300 px grid tile, the
browser downloads a file 3–4 times bigger than needed.

### Lazy loading, layout shift and priority

- **`loading="lazy"`**: the browser only downloads an image when it's about to scroll into view.
  On a long item page, most images are never downloaded if the visitor doesn't scroll.
- **`width` / `height`**: with the CSS `height: auto`, the browser knows the image's shape before
  it loads and reserves exactly that space, so the text doesn't jump when images arrive.
- **The main color as background**: fills that reserved space until the image appears.
- **`priority`**: the first image on a page loads right away (`loading="eager"`,
  `fetchpriority="high"`), since it's what visitors see first.

### Loaders: data at build time, not in the visitor's download

The item page has a `loader` function. React Router runs it **at build time** for every pre-rendered
page, and the page component gets its result as `loaderData`:

```ts
export function loader({ params }) {
  const item = getItem(params.slug);
  if (!item) throw data(null, { status: 404 });
  return { item, images: getImages(...) };
}
```

Because only the loader touches `src/content`, the full list of items and images is never part of
the JavaScript sent to visitors. Each page gets just its own data, saved at build time as a small
`_.data` file next to its `index.html`. When a visitor clicks to another item, the browser fetches
that file instead of a whole new page.

`src/content/index.ts` is the one place pages read content from. It uses `import.meta.glob`, a Vite
feature that imports every file matching a pattern (`./items/*.json`) at build time, so adding an
item file needs no code change.

### Pre-rendering from content

`react-router.config.ts` now builds its `prerender` list from the content: the fixed pages plus
`/portfolio-item/<slug>/` for every published item (`config/contentPaths.ts`). Add an item file and
its page is generated on the next build; mark it as a draft and it isn't.

### Videos instead of GIFs

GIF is a 1987 format: at most 256 colors per frame, and every frame compressed on its own. A
video codec like H.264 only stores what **changes** between frames, which suits a slowly rotating
ring perfectly. That's why the 15 MB turnaround became a 2.5 MB MP4 with no visible difference,
while animated WebP (which works more like a GIF) only got to 12.8 MB.

`npm run gif-to-video` runs [ffmpeg](https://ffmpeg.org/) once per GIF, and the MP4 is committed as
the new original. That keeps ffmpeg out of the normal build: anyone can build the site without
installing it. A few ffmpeg settings worth knowing (`scripts/gif-to-video/`):

- **CRF** (constant rate factor) sets quality instead of file size: lower is better and bigger. 26
  looked identical to the GIFs here.
- **`yuv420p`** is the pixel format every browser can play.
- **`+faststart`** puts the video's index at the start of the file, so playback can begin before
  the whole file has downloaded.

### Lazy-loading a video with IntersectionObserver

`<img loading="lazy">` is built into browsers, but `<video>` has no equivalent. `<LoopVideo>`
(`src/components/LoopVideo/`) does it by hand:

- The pre-rendered HTML has the `<video>` with only a **poster** image, and no `src`, so nothing
  downloads.
- After hydration, an **IntersectionObserver** watches it. The browser calls back when the element
  comes within 200px of the screen; the component then sets `src` and plays. Scrolled away, it
  pauses, which saves battery.
- Browsers only autoplay videos that are **muted**, and set `muted` from code because React's
  `muted` attribute isn't reliable.

### Respecting "reduce motion" (`useSyncExternalStore`)

Visitors can ask their operating system for less motion. CSS reads that with
`@media (prefers-reduced-motion: reduce)`, and `src/hooks/usePrefersReducedMotion.ts` gives React
the same answer. It uses `useSyncExternalStore`, React's hook for reading something that lives
outside React (here the browser's media query): one function subscribes to changes, one reads the
current value, and a third gives the value to use while pre-rendering, where there is no browser.
With reduced motion on, videos show their poster with play controls instead of autoplaying.

### Decorative images: `alt=""`

On the home grid, each tile's link already contains the item's title as text. Giving the image
`alt="Wall-E Necklace"` as well would make screen readers say the name twice. An **empty** `alt`
marks an image as decorative so it's skipped. (Leaving `alt` out entirely is different and wrong:
screen readers then read the file name.) The same goes for the tile video, via `aria-hidden`.

---

## Step 1d: portfolio grid and filters

### Filters as pages, not state

On the old site, clicking "Fine" filtered the grid in place with JavaScript, and the address bar
didn't change. Here each filter is a **link to its own page**, `/portfolio-category/fine/`:

- The filtered view has a URL you can bookmark or send, and the browser's back button works.
- It's the same URL WordPress used, so old links and search results keep working.
- Each one is pre-rendered like any other page, so search engines see it.
- It still feels instant: after the first page, React Router fetches only that page's small data
  file (`_.data`) and swaps the grid. `preventScrollReset` on the filter links keeps the scroll
  position, so only the grid changes.

The home, category and tag pages are three thin route modules (`src/pages/portfolio/`) that share
one loader helper (`portfolio.data.ts`) and one view (`PortfolioView.tsx`).

### `aria-current` for "you are here"

The active filter and the active menu item get `aria-current="page"`. Screen readers announce it
("Fine, current page"), so the highlight isn't only visual. "Portfolio" in the menu stays active
on category, tag and item pages too (`isNavActive` in `src/components/SiteLayout/navigation.ts`).

### Passing data to CSS with custom properties

The number of tiles per row comes from `grid.json`, which the admin will edit, so it can't be
hard-coded in the stylesheet. `PortfolioGrid` passes the values as CSS custom properties on the
element:

```tsx
<ul style={{ '--columns-wide': 5, '--columns-tablet': 2, '--gap': '10px' }}>
```

and the stylesheet uses them inside its media queries:
`grid-template-columns: repeat(var(--columns-wide), minmax(0, 1fr))`. Data stays in data, and layout
stays in CSS.

One catch: the `sizes` attribute on images is read by the browser before CSS, so it **can't** use
CSS variables. `PortfolioGrid` builds `sizes` from the same column counts in TypeScript instead.

### `grid-auto-flow: dense` for featured tiles

A featured tile spans 2 columns × 2 rows. With normal placement that leaves holes when the next
tile doesn't fit on the row. `grid-auto-flow: row dense` lets later tiles move back to fill those
holes. The order shifts a little around a featured tile, but there are no gaps.

### `HydrateFallback`: pages that weren't pre-rendered

Every known page is pre-rendered. A mistyped address like `/portfolio-tag/nope/` has no HTML file,
so the host serves a generic fallback page instead (the 404 page from step 1e). React Router
renders the root's `HydrateFallback` there (here just the empty sidebar frame) while it loads in the
browser and works out what to show, which for an unknown slug is the "Page not found" page.

The root also has a `meta` export now. Normal pages replace it with their own title, so it only
shows on error pages ("Page not found – Jewelry by Jonathan Silva").

### Masonry without a masonry library

The masonry layout (`src/pages/item/masonry.ts`) packs images of different heights into columns,
with "large" images two columns wide. Libraries usually do this by measuring every image in the
browser and positioning it with JavaScript. Here it's worked out ahead of time, because every
image's width and height is already known from the image build:

- The images sit in a CSS grid whose rows are tiny (0.5% of the grid's width).
- Each image spans as many rows as its height needs. For a square image in one of two columns,
  that's about 100 rows.
- `grid-auto-flow: dense` puts each image in the highest free spot that fits, which is exactly
  what masonry does.
- All the sizes are in **`cqw`** units, a percentage of a *container's* width. The grid's wrapper
  is marked `container-type: inline-size`, so `1cqw` is 1% of its width. The whole layout scales
  with the screen, and the numbers never need recalculating.

So the layout is already correct in the pre-rendered HTML, before any JavaScript runs, and
nothing shifts as images load.

### The `<dialog>` element for the lightbox

A lightbox is a modal: while it's open, nothing behind it should be clickable or reachable with
Tab, Escape should close it, and focus should go back where it was afterwards. Doing that by hand
takes a lot of code (focus traps, `aria-modal`, key handlers). The browser's own `<dialog>` element,
opened with `showModal()`, does all of it:

- It's shown in the browser's **top layer**, above everything else, with a `::backdrop` behind it.
- The rest of the page becomes **inert**: it can't be clicked, tabbed to or read by screen readers.
- Escape closes it and fires a `close` event, which the component listens to.
- When it closes, focus returns to the element that opened it (here, the image button).

`src/components/Lightbox/` adds the rest: arrow keys, swipe, and closing on a backdrop click (a
click on the dark area lands on the `<dialog>` element itself rather than on its content).

### `:has()`: CSS that reacts to what's inside

To stop the page scrolling behind the lightbox, `global.scss` has:

```css
html:has(dialog[open]) { overflow: hidden; }
```

`:has()` selects an element based on what it contains: "the `<html>` element, if it has an open
dialog somewhere inside". The browser applies and removes the rule by itself as the dialog opens
and closes, with no JavaScript to forget to undo.

### Click-to-play embeds

An embedded YouTube player downloads close to 1 MB of scripts and sets tracking cookies as soon as
the page loads, even if nobody presses play. `src/components/YouTubeEmbed/` shows just the video's
thumbnail (a plain image from YouTube's image server) and a play button. Only on click does it swap
in the real player, from `youtube-nocookie.com`, YouTube's privacy-enhanced domain, with
`autoplay=1` so one click is enough.

### A form that works with or without JavaScript

The contact form (`src/pages/contact/ContactForm.tsx`) is a plain HTML form that posts straight to
Web3Forms, a service that emails each message to you. If JavaScript hasn't loaded (or fails), the
browser submits it the old-fashioned way and Web3Forms shows its own "sent" page. When JavaScript
is running, the form catches the submit, sends the same data with `fetch`, and shows the result in
place. This is called **progressive enhancement**: the basic version works everywhere, and the
nicer version is layered on top.

Some other details:

- **Spam trap ("honeypot")**: a checkbox hidden from people but still visible to bots. Bots tend to
  fill in every field, so a ticked box means the message is dropped.
- **`role="status"`**: the line that says "sent" or explains an error is announced by screen
  readers when it changes.
- **The access key is public on purpose.** It's in the page's HTML, and it can only send messages
  to the one email address it was created for, so publishing it is safe. The real address is never
  in the page.
- **Testing without a network**: `sendMessage.ts` takes the `fetch` function as a parameter, so
  the tests pass in a fake one and check what would be sent.

### Icons as inline SVG

The LinkedIn and Behance icons are SVG paths written straight into the HTML
(`src/components/SiteLayout/socialIcons.ts`), not an icon font like the old site used. They need no
extra download, stay sharp at any size, and take their color from the text (`fill="currentColor"`),
so the hover color change is plain CSS. The link gets an `aria-label` ("LinkedIn"), and the SVG is
`aria-hidden`, since a screen reader can't read a drawing.
