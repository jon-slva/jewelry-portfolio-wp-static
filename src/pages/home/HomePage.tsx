import type { CSSProperties } from 'react';
import { Link } from 'react-router';
import LoopVideo from '../../components/LoopVideo/LoopVideo';
import Picture from '../../components/Picture/Picture';
import { getImage, getVideo, grid, items } from '../../content';
import { getGridItems } from '../../content/portfolio.ts';
import site from '../../content/site.json';
import styles from './HomePage.module.scss';
import type { Route } from './+types/HomePage';

// Shown width of a tile at each grid.json breakpoint, so the browser picks the right file.
const TILE_SIZES =
  '(min-width: 1201px) calc((100vw - 423px) / 5), (min-width: 1025px) calc((100vw - 423px) / 3), ' +
  '(min-width: 681px) calc((100vw - 32px) / 2), calc(100vw - 32px)';

export function loader() {
  return {
    columns: grid.columns,
    gap: grid.gap,
    tiles: getGridItems(items, grid).map((item) => ({
      slug: item.slug,
      title: item.title,
      cover: getImage(item.cover),
      coverVideo: item.coverVideo ? getVideo(item.coverVideo) : undefined,
    })),
  };
}

export function meta() {
  return [
    { title: `${site.title} – ${site.tagline}` },
    { name: 'description', content: site.tagline },
  ];
}

export default function HomePage({ loaderData }: Route.ComponentProps) {
  const { tiles, columns, gap } = loaderData;
  // grid.json settings, passed to the stylesheet as CSS variables.
  const gridStyle = {
    '--columns-wide': columns.wide,
    '--columns-desktop': columns.desktop,
    '--columns-tablet': columns.tablet,
    '--columns-phone': columns.phone,
    '--gap': `${gap}px`,
  } as CSSProperties;

  return (
    <section>
      <h1 className={styles.visuallyHidden}>Portfolio</h1>
      {/* TODO(phase 1d): filter bar, hover overlay with the title, featured (double) tiles.
          For now: every published item in grid.json order, with its title below. */}
      {/* Tile images use alt="": the visible title already names the link. */}
      <ul className={styles.grid} style={gridStyle}>
        {tiles.map((tile, i) => (
          <li key={tile.slug}>
            <Link to={`/portfolio-item/${tile.slug}/`} className={styles.tile}>
              {tile.coverVideo ? (
                <LoopVideo video={tile.coverVideo} poster={tile.cover} alt="" displayWidth={400} />
              ) : (
                <Picture image={tile.cover} alt="" sizes={TILE_SIZES} priority={i < 5} />
              )}
              <span className={styles.title}>{tile.title}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
