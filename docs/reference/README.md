# Reference screenshots

Full-page captures of the old WordPress site (https://jewelrybyjs.com), taken 2026-11-23 before it was
shut down. They're the visual reference for rebuilding layout, filters and content order.

- Desktop captures: 1440 px wide
- Mobile captures: 390 px wide
- All captures at 1x pixel density

| File | Page | Shows |
|---|---|---|
| `home-*` | `/` | Portfolio grid, all items, in the original order |
| `home-filter-fine-*` | `/` | Grid after clicking the "Fine" filter |
| `home-tile-hover-desktop` | `/` | Dark overlay + title on hover (first tile) |
| `item-reza-ruban-ring-masonry-*` | item | "Small masonry" layout: 2 columns with large/normal images |
| `item-wall-e-necklace-stacked-*` | item | "Small images" layout: single column of images, text column on the right |
| `item-crocodile-necklace-gallery-*` | item | "Gallery" layout: 3 columns, with an embedded YouTube video as the last tile |
| `item-reza-spirale-ring-gifs-*` | item | Item with animated GIF turnarounds (captured as a still frame) |
| `resume-*` | `/resume/` | Resume preview image linking to the PDF |
| `contact-*` | `/contact-me/` | Contact details |
| `404-*` | missing URL | Not-found page |

## Things to know when comparing

- **White block in the bottom-left corner of desktop captures:** a capture artifact. The left sidebar is fixed-position, so it only paints for the first screen height of a full-page capture. On the real site the sidebar stays black.
- **Clipped right edge on desktop item pages:** the item title and details column, and the third gallery column, are cut off at 1440 px. The live site does this too (the theme sets `overflow-x: hidden` on the body). The rebuild should fix it, not copy it.
- **Faint filter labels:** they fade in on load, so a capture can catch them at low opacity.
