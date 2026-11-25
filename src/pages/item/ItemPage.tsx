import { useState } from 'react';
import { data } from 'react-router';
import Lightbox from '../../components/Lightbox/Lightbox';
import { categories, getImage, getItem, getVideo, tags } from '../../content';
import site from '../../content/site.json';
import type { Route } from './+types/ItemPage';
import ItemDetails from './ItemDetails';
import ItemMedia from './ItemMedia';
import type { ItemMedia as Media } from './item.types.ts';
import styles from './ItemPage.module.scss';

// Runs at build time for each pre-rendered item page (and on request in dev).
export function loader({ params }: Route.LoaderArgs) {
  const item = getItem(params.slug);
  if (!item) throw data(null, { status: 404 });

  // Look up the web files for each entry. Entries whose files are missing are
  // dropped (npm run validate reports them).
  const media = item.media.flatMap((entry, i): Media[] => {
    const key = `${i}-${entry.type}`;
    if (entry.type === 'image') {
      const image = getImage(entry.file);
      return image ? [{ type: 'image', key, alt: entry.alt, size: entry.size, image }] : [];
    }
    if (entry.type === 'video') {
      const video = getVideo(entry.file);
      const poster = getImage(entry.poster);
      return video ? [{ type: 'video', key, alt: entry.alt, size: entry.size, video, poster }] : [];
    }
    return [{ type: 'youtube', key, title: entry.title, size: entry.size, id: entry.id }];
  });

  return {
    item,
    media,
    itemCategories: categories.filter((term) => item.categories.includes(term.slug)),
    itemTags: tags.filter((term) => item.tags.includes(term.slug)),
  };
}

export function meta({ loaderData }: Route.MetaArgs) {
  if (!loaderData) return [{ title: `Not found – ${site.title}` }];
  // TODO(phase 1e): description, canonical URL and Open Graph image from the item.
  return [{ title: `${loaderData.item.title} – ${site.title}` }];
}

export default function ItemPage({ loaderData }: Route.ComponentProps) {
  const { item, media, itemCategories, itemTags } = loaderData;
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const images = media.flatMap((entry) =>
    entry.type === 'image' ? [{ image: entry.image, alt: entry.alt }] : [],
  );

  return (
    <article className={item.layout.type === 'gallery' ? styles.below : styles.beside}>
      <div className={styles.details}>
        <ItemDetails
          title={item.title}
          subtitle={item.subtitle}
          description={item.description}
          software={item.software}
          client={item.client}
          categories={itemCategories}
          tags={itemTags}
        />
      </div>
      <div className={styles.media}>
        <ItemMedia media={media} layout={item.layout} onOpenImage={setLightboxIndex} />
      </div>
      <Lightbox images={images} index={lightboxIndex} onIndexChange={setLightboxIndex} />
    </article>
  );
}
