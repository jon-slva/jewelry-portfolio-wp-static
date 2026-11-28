import type { CSSProperties } from 'react';
import type { ItemMedia as Media, ItemMediaProps } from './item.types.ts';
import { masonryCells } from './masonry.ts';
import MediaTile from './MediaTile';
import styles from './ItemMedia.module.scss';

// Width of the media column (see ItemPage.module.scss), for the `sizes`
// attribute: beside the text from 1200px (sidebar 363 + padding 60 + text
// column 300 + gap 30 = 753px), the full content width below that.
function columnSizes(fraction: number, besideText: boolean): string {
  const wide = besideText ? '100vw - 753px' : '100vw - 423px';
  return [
    `(min-width: 1200px) calc((${wide}) * ${fraction})`,
    `(min-width: 1024px) calc((100vw - 423px) * ${fraction})`,
    `(min-width: 681px) calc((100vw - 32px) * ${fraction})`,
    'calc(100vw - 32px)',
  ].join(', ');
}

/** Width ÷ height of an entry, so its space is reserved before it loads. */
function aspectOf(media: Media): number {
  if (media.type === 'image') return media.image.width / media.image.height;
  if (media.type === 'video' && media.poster) return media.poster.width / media.poster.height;
  return 16 / 9;
}

/**
 * The item's images and videos, in the layout chosen for the item:
 * - masonry: packed columns, large images two columns wide
 * - stacked: one image under another
 * - gallery: a grid of equal tiles
 */
export default function ItemMedia({ media, layout, onOpenImage }: ItemMediaProps) {
  const imageCount = media.filter((entry) => entry.type === 'image').length;
  let nextImage = 0;
  const imageIndexes = media.map((entry) => (entry.type === 'image' ? nextImage++ : undefined));

  const tile = (entry: Media, i: number, sizes: string) => (
    <MediaTile
      media={entry}
      sizes={sizes}
      imageIndex={imageIndexes[i]}
      imageCount={imageCount}
      priority={i === 0}
      onOpenImage={onOpenImage}
    />
  );

  if (layout.type === 'masonry') {
    const cells = masonryCells(
      media.map((entry) => ({ aspect: aspectOf(entry), large: entry.size === 'large' })),
      layout.columns,
    );
    return (
      <div className={styles.masonryContainer}>
        <div className={styles.masonry} style={{ '--columns': layout.columns } as CSSProperties}>
          {media.map((entry, i) => {
            const { colSpan, rowSpan } = cells[i];
            const style = {
              '--col-span': colSpan,
              '--row-span': rowSpan,
              '--aspect': aspectOf(entry),
            } as CSSProperties;
            return (
              <div key={entry.key} className={styles.masonryCell} style={style}>
                {tile(entry, i, columnSizes(colSpan / layout.columns, true))}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (layout.type === 'gallery') {
    return (
      <div className={styles.gallery} style={{ '--columns': layout.columns } as CSSProperties}>
        {media.map((entry, i) => (
          <div key={entry.key} className={styles.galleryCell}>
            {tile(entry, i, columnSizes(1 / layout.columns, false))}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={styles.stacked}>
      {media.map((entry, i) => (
        <div
          key={entry.key}
          className={styles.stackedCell}
          style={{ '--aspect': aspectOf(entry) } as CSSProperties}
        >
          {tile(entry, i, columnSizes(1, true))}
        </div>
      ))}
    </div>
  );
}
