import type { CSSProperties } from 'react';
import { Link } from 'react-router';
import LoopVideo from '../LoopVideo/LoopVideo';
import Picture from '../Picture/Picture';
import styles from './PortfolioGrid.module.scss';
import type { PortfolioGridProps } from './PortfolioGrid.types.ts';

// Shown width of a tile at each breakpoint (matching the stylesheet), so the
// browser downloads a file just big enough. 423px = sidebar + page padding.
// (`sizes` can't use CSS variables, so the column counts are filled in here.)
function tileSizes(columns: PortfolioGridProps['columns'], span: number): string {
  const share = (count: number) => Math.min(span, count) / count;
  return [
    `(min-width: 1201px) calc((100vw - 423px) * ${share(columns.wide)})`,
    `(min-width: 1025px) calc((100vw - 423px) * ${share(columns.desktop)})`,
    `(min-width: 681px) calc((100vw - 32px) * ${share(columns.tablet)})`,
    `calc((100vw - 32px) * ${share(columns.phone)})`,
  ].join(', ');
}

/**
 * The front-page grid: cover tiles in grid.json order, with the title shown
 * over a dark overlay on hover or keyboard focus (as on the original site).
 */
export default function PortfolioGrid({ tiles, columns, gap }: PortfolioGridProps) {
  // grid.json settings, passed to the stylesheet as CSS variables.
  const style = {
    '--columns-wide': columns.wide,
    '--columns-desktop': columns.desktop,
    '--columns-tablet': columns.tablet,
    '--columns-phone': columns.phone,
    '--gap': `${gap}px`,
  } as CSSProperties;

  return (
    <ul className={styles.grid} style={style}>
      {tiles.map((tile, i) => (
        <li key={tile.slug} className={tile.featured ? styles.featured : undefined}>
          <Link to={`/portfolio-item/${tile.slug}/`} className={styles.tile}>
            {/* alt="": the title in the overlay already names the link. */}
            {tile.coverVideo ? (
              <LoopVideo
                video={tile.coverVideo}
                poster={tile.cover}
                alt=""
                displayWidth={tile.featured ? 800 : 400}
                className={styles.media}
              />
            ) : (
              <Picture
                image={tile.cover}
                alt=""
                sizes={tileSizes(columns, tile.featured ? 2 : 1)}
                priority={i < columns.wide}
                className={styles.media}
              />
            )}
            <span className={styles.overlay}>
              <span className={styles.title}>{tile.title}</span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
