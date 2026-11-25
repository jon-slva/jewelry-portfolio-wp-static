import { data } from 'react-router';
import LoopVideo from '../../components/LoopVideo/LoopVideo';
import Picture from '../../components/Picture/Picture';
import { categories, getImages, getItem, getVideos, tags } from '../../content';
import site from '../../content/site.json';
import styles from './ItemPage.module.scss';
import type { Route } from './+types/ItemPage';

// Runs at build time for each pre-rendered item page (and on request in dev).
export function loader({ params }: Route.LoaderArgs) {
  const item = getItem(params.slug);
  if (!item) throw data(null, { status: 404 });

  const imagePaths = item.media.flatMap((media) =>
    media.type === 'image' ? [media.file] : media.type === 'video' ? [media.poster] : [],
  );
  const videoPaths = item.media.flatMap((media) => (media.type === 'video' ? [media.file] : []));
  const termNames = (terms: typeof categories, slugs: string[]) =>
    slugs.map((slug) => terms.find((term) => term.slug === slug)?.name ?? slug);

  return {
    item,
    images: getImages(imagePaths),
    videos: getVideos(videoPaths),
    categoryNames: termNames(categories, item.categories),
    tagNames: termNames(tags, item.tags),
  };
}

export function meta({ loaderData }: Route.MetaArgs) {
  if (!loaderData) return [{ title: `Not found – ${site.title}` }];
  // TODO(phase 1e): description, canonical URL and Open Graph image from the item.
  return [{ title: `${loaderData.item.title} – ${site.title}` }];
}

export default function ItemPage({ loaderData }: Route.ComponentProps) {
  const { item, images, videos, categoryNames, tagNames } = loaderData;

  return (
    <article className={styles.item}>
      <header className={styles.text}>
        <h1 className={styles.title}>{item.title}</h1>
        {item.subtitle && <p className={styles.subtitle}>{item.subtitle}</p>}
        {item.description.split('\n\n').map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
        <dl className={styles.details}>
          {item.software.length > 0 && (
            <>
              <dt>Software</dt>
              <dd>{item.software.join(', ')}</dd>
            </>
          )}
          {item.client && (
            <>
              <dt>Client</dt>
              <dd>{item.client}</dd>
            </>
          )}
          <dt>Category</dt>
          <dd>{categoryNames.join(', ')}</dd>
          {tagNames.length > 0 && (
            <>
              <dt>Tags</dt>
              <dd>{tagNames.join(', ')}</dd>
            </>
          )}
        </dl>
      </header>

      {/* TODO(phase 1d): masonry / stacked / gallery layouts, lightbox, click-to-play videos.
          For now every image and video is listed in a single column. */}
      <div className={styles.media}>
        {item.media.map((media, i) => {
          switch (media.type) {
            case 'image':
              return (
                <Picture
                  key={media.file}
                  image={images[media.file]}
                  alt={media.alt}
                  sizes="(min-width: 1024px) min(900px, calc(100vw - 423px)), calc(100vw - 32px)"
                  priority={i === 0}
                />
              );
            case 'video':
              return (
                <LoopVideo
                  key={media.file}
                  video={videos[media.file]}
                  poster={images[media.poster]}
                  alt={media.alt}
                  displayWidth={900}
                />
              );
            case 'youtube':
              return (
                <a
                  key={media.id}
                  className={styles.youtube}
                  href={`https://www.youtube.com/watch?v=${media.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  ▶ {media.title} (YouTube)
                </a>
              );
          }
        })}
      </div>
    </article>
  );
}
